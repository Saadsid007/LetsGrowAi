/**
 * Merges the gap analysis results from Gemini and Cerebras based on priority rules.
 * Pure Node.js logic (no AI call).
 * 
 * @param {Object} geminiResult - The result from analyzeSkillGap_Gemini
 * @param {Object} cerebrasResult - The result from analyzeSkillGap_Cerebras
 * @param {string[]} allRequiredSkills - List of all required skills extracted from JD
 * @returns {Object} MergedGapResult
 */
export function mergeGapResults(geminiResult, cerebrasResult, allRequiredSkills) {
  const merged = {
    confirmed: [],
    highPriority: [],
    mediumPriority: [],
    lowPriority: [],
    gapScore: 0,
    totalWeeksToReady: 0,
    summaryNote: geminiResult?.summaryNote || cerebrasResult?.summaryNote || 'Analysis completed.'
  };

  // Gap Score Average
  const gScore = geminiResult?.gapScore || 0;
  const cScore = cerebrasResult?.gapScore || 0;
  
  if (geminiResult && cerebrasResult) {
    merged.gapScore = Math.round((gScore + cScore) / 2);
  } else {
    merged.gapScore = gScore || cScore;
  }

  // Create maps for quick lookup
  const gMissingMap = new Map((geminiResult?.missing || []).map(item => [item.skill.toLowerCase(), item]));
  const cMissingMap = new Map((cerebrasResult?.missing || []).map(item => [item.skill.toLowerCase(), item]));
  const gMatchedMap = new Map((geminiResult?.matched || []).map(item => [item.skill.toLowerCase(), item]));
  const cMatchedMap = new Map((cerebrasResult?.matched || []).map(item => [item.skill.toLowerCase(), item]));

  const processSkill = (skill) => {
    const sLower = skill.toLowerCase();
    
    const gMiss = gMissingMap.get(sLower);
    const cMiss = cMissingMap.get(sLower);
    const gMatch = gMatchedMap.get(sLower);
    const cMatch = cMatchedMap.get(sLower);

    // If both say missing
    if (gMiss && cMiss) {
      const priority = (gMiss.priority === 'high' || cMiss.priority === 'high') ? 'high' :
                       (gMiss.priority === 'medium' || cMiss.priority === 'medium') ? 'medium' : 'low';
      
      const entry = {
        skill: gMiss.skill || cMiss.skill || skill,
        reason: gMiss.reason || cMiss.reason || 'Flagged by both AI models as missing.',
        estimatedWeeks: gMiss.estimatedWeeks || cMiss.estimatedWeeks || 2,
        confidence: 'verified',
        priority // Add priority here to help routing to the right array
      };
      
      return entry;
    }

    // If only one says missing
    if (gMiss || cMiss) {
      const miss = gMiss || cMiss;
      let downgradedPriority = 'low';
      if (miss.priority === 'high') downgradedPriority = 'medium';
      else if (miss.priority === 'medium') downgradedPriority = 'low';
      
      // But if the other explicitly matched it, it's a conflict
      if ((gMiss && cMatch) || (cMiss && gMatch)) {
        // One says missing, one says matched. Treat as partial match instead of missing.
        merged.confirmed.push({
          skill: miss.skill || skill,
          confidence: 'partial',
          note: 'May need deepening (AI models disagreed on proficiency).'
        });
        return null;
      }

      return {
        skill: miss.skill || skill,
        reason: miss.reason || 'Flagged by one AI model as missing.',
        estimatedWeeks: miss.estimatedWeeks || 2,
        confidence: 'unverified',
        priority: downgradedPriority
      };
    }

    // MATCHED
    if (gMatch && cMatch) {
      const confidence = (gMatch.confidence === 'full' && cMatch.confidence === 'full') ? 'full' : 'partial';
      merged.confirmed.push({
        skill: gMatch.skill || cMatch.skill || skill,
        confidence,
        note: (confidence === 'full') ? 'Confirmed present.' : 'Marked as partial match.'
      });
      return null;
    }

    // Only one says matched
    if (gMatch || cMatch) {
      const match = gMatch || cMatch;
      merged.confirmed.push({
        skill: match.skill || skill,
        confidence: 'partial', // downgrade to partial since unverified
        note: match.note || 'Unverified match.'
      });
      return null;
    }
    
    return null; // Not found in either (unlikely since we iterate over all required skills)
  };

  // Keep track of processed to avoid duplicates
  const processed = new Set();

  allRequiredSkills.forEach(skill => {
    const sLower = skill.toLowerCase();
    if (processed.has(sLower)) return;
    processed.add(sLower);

    const missingEntry = processSkill(skill);
    if (missingEntry) {
      if (missingEntry.priority === 'high') merged.highPriority.push(missingEntry);
      else if (missingEntry.priority === 'medium') merged.mediumPriority.push(missingEntry);
      else merged.lowPriority.push(missingEntry);
      
      merged.totalWeeksToReady += missingEntry.estimatedWeeks;
      delete missingEntry.priority; // clean up before pushing to final arrays
    }
  });

  return merged;
}
