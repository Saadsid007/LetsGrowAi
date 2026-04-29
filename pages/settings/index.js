import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import WorkspaceLayout from '../../components/WorkspaceLayout';
import Icon from '../../components/Icon';
import { toast, Toaster } from 'sonner';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs structure
  const TABS = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'security', label: 'Security', icon: 'lock' },
    { id: 'career', label: 'Career Prefs', icon: 'work' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'danger', label: 'Danger Zone', icon: 'warning' }
  ];

  // Component states
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [skillInput, setSkillInput] = useState({ tech: '', soft: '', city: '' });
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/settings/export');
      const data = await res.json();
      if (data.profile) {
        setUser(data.profile);
        setFormData({
          name: data.profile.name || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
          location: data.profile.location || '',
          linkedinUrl: data.profile.linkedinUrl || '',
          githubUrl: data.profile.githubUrl || '',
          portfolioUrl: data.profile.portfolioUrl || '',
          bio: data.profile.bio || '',
          
          targetRole: data.profile.targetRole || '',
          experienceLevel: data.profile.experienceLevel || '',
          education: data.profile.education || { degree: '', fieldOfStudy: '', college: '', graduationYear: '' },
          skills: data.profile.skills || { technical: [], soft: [] },
          jobPreferences: data.profile.jobPreferences || { jobType: [], workMode: [], preferredCities: [], expectedCTC: '', openToRelocate: false },
          notifications: data.profile.notifications || { platformUpdates: true, roadmapReminders: true, weeklyReport: true, interviewReminders: false, newFeatures: true }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e?.preventDefault();
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        toast.success('Profile updated ✅');
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password updated successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error('Failed to update password');
    }
  };

  const handleNotificationSave = async () => {
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: formData.notifications })
      });
      const data = await res.json();
      if (data.success) toast.success('Notification preferences saved');
    } catch (e) {
      toast.error('Failed to update notifications');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch('/api/settings/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: deleteConfirm })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Account deleted successfully');
        setTimeout(() => window.location.href = '/', 1000);
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error('Failed to delete account');
    }
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', color: 'bg-transparent' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;

    if (score < 2) return { label: 'Weak', color: 'bg-red-500', width: '25%' };
    if (score === 2) return { label: 'Fair', color: 'bg-yellow-500', width: '50%' };
    if (score === 3) return { label: 'Strong', color: 'bg-green-500', width: '75%' };
    return { label: 'Very Strong', color: 'bg-emerald-600', width: '100%' };
  };

  const addTag = (field, type, value) => {
    if (!value.trim()) return;
    setFormData(p => ({
      ...p,
      [field]: { ...p[field], [type]: [...(p[field][type] || []), value.trim()] }
    }));
  };

  const removeTag = (field, type, idx) => {
    setFormData(p => {
      const arr = [...(p[field][type] || [])];
      arr.splice(idx, 1);
      return { ...p, [field]: { ...p[field], [type]: arr } };
    });
  };

  const toggleCheckbox = (field, type, value) => {
    setFormData(p => {
      const arr = p[field][type] || [];
      const newArr = arr.includes(value) ? arr.filter(i => i !== value) : [...arr, value];
      return { ...p, [field]: { ...p[field], [type]: newArr } };
    });
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'U';

  if (isLoading) return <div className="p-10 text-center"><Icon name="sync" className="animate-spin text-4xl text-primary" /></div>;

  return (
    <WorkspaceLayout>
      <Head>
        <title>Settings | LetsGrowAi</title>
      </Head>
      <Toaster position="bottom-right" />
      
      <div className="flex-1 overflow-y-auto bg-surface-container-lowest p-4 md:p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-extrabold font-headline text-on-surface mb-8">Settings</h1>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Tabs */}
            <div className="md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-on-surface-variant hover:bg-surface-container-low'
                  } ${tab.id === 'danger' && activeTab === tab.id ? 'bg-red-50 text-red-600' : ''} ${tab.id === 'danger' && activeTab !== tab.id ? 'hover:text-red-600 hover:bg-red-50/50' : ''}`}
                >
                  <Icon name={tab.icon} className="text-[20px]" /> {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-outline-variant/20 animate-in fade-in duration-300">
              
              {/* TAB 1: PROFILE */}
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileSave} className="space-y-8">
                  <div className="flex items-center gap-6 pb-6 border-b border-outline-variant/20">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                      {initials}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-on-surface">{formData.name}</h2>
                      <p className="text-sm text-on-surface-variant mt-1">Update your photo and personal details.</p>
                      
                      <div className="mt-3 flex items-center gap-2">
                        <div className="w-48 h-2 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${user?.profileScore || 0}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-primary">{user?.profileScore || 0}% Complete</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Full Name *</label>
                      <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:border-primary outline-none transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex justify-between">Email * <span className="text-green-600 font-medium normal-case flex items-center gap-1"><Icon name="check_circle" className="text-[14px]"/> Verified</span></label>
                      <input disabled value={formData.email} className="w-full p-3 bg-surface-container-low border border-outline-variant/40 rounded-xl outline-none text-on-surface-variant cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Phone Number</label>
                      <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:border-primary outline-none transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Location (City, State)</label>
                      <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:border-primary outline-none transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex justify-between">
                      Professional Bio
                      <span className={`${(formData.bio?.length || 0) > 300 ? 'text-red-500' : 'text-outline'} normal-case font-medium`}>{formData.bio?.length || 0}/300</span>
                    </label>
                    <textarea maxLength={300} rows={4} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full p-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:border-primary outline-none transition-colors resize-none" placeholder="A short bio about yourself..." />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">LinkedIn URL</label>
                      <div className="relative">
                        <Icon name="link" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                        <input value={formData.linkedinUrl} onChange={e => setFormData({...formData, linkedinUrl: e.target.value})} className="w-full pl-10 p-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:border-primary outline-none transition-colors" placeholder="https://linkedin.com/in/..." />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">GitHub URL</label>
                      <div className="relative">
                        <Icon name="code" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                        <input value={formData.githubUrl} onChange={e => setFormData({...formData, githubUrl: e.target.value})} className="w-full pl-10 p-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:border-primary outline-none transition-colors" placeholder="https://github.com/..." />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button type="submit" className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 transition-all">Save Profile</button>
                  </div>
                </form>
              )}

              {/* TAB 2: SECURITY */}
              {activeTab === 'security' && (
                <div className="space-y-10">
                  <form onSubmit={handlePasswordSave} className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-on-surface">Change Password</h3>
                      <p className="text-sm text-on-surface-variant mt-1">Ensure your account is using a long, random password to stay secure.</p>
                    </div>

                    <div className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Current Password</label>
                        <input type="password" required value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} className="w-full p-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:border-primary outline-none transition-colors" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex justify-between">
                          New Password
                          <span className="text-primary normal-case font-medium">{getPasswordStrength(passwordData.newPassword).label}</span>
                        </label>
                        <input type="password" required minLength={8} value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full p-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:border-primary outline-none transition-colors" />
                        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mt-1">
                          <div className={`h-full transition-all duration-300 ${getPasswordStrength(passwordData.newPassword).color}`} style={{ width: getPasswordStrength(passwordData.newPassword).width || '0%' }}></div>
                        </div>
                        <p className="text-xs text-outline">Must be at least 8 characters containing numbers and symbols.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex justify-between">
                          Confirm Password
                          {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && <span className="text-green-600 normal-case font-medium">✓ Passwords match</span>}
                        </label>
                        <input type="password" required value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full p-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:border-primary outline-none transition-colors" />
                      </div>
                      <button type="submit" className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold hover:-translate-y-0.5 transition-all">Update Password</button>
                    </div>
                  </form>

                  <div className="pt-8 border-t border-outline-variant/20">
                    <h3 className="text-lg font-bold text-on-surface">Session Info</h3>
                    <div className="mt-4 p-4 bg-surface-container-low rounded-xl flex items-center justify-between border border-outline-variant/20">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-full text-primary"><Icon name="laptop_mac" /></div>
                        <div>
                          <p className="font-bold text-on-surface">Current Session</p>
                          <p className="text-sm text-on-surface-variant">Logged in since {new Date(user?.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Active</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CAREER PREFS */}
              {activeTab === 'career' && (
                <div className="space-y-10">
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">Career Goals</h3>
                    <p className="text-sm text-on-surface-variant mt-1">These preferences feed into all AI modules for personalized guidance.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Target Role</label>
                      <input value={formData.targetRole} onChange={e => setFormData({...formData, targetRole: e.target.value})} className="w-full p-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:border-primary outline-none transition-colors" placeholder="e.g. Full Stack Developer" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Experience Level</label>
                      <select value={formData.experienceLevel} onChange={e => setFormData({...formData, experienceLevel: e.target.value})} className="w-full p-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:border-primary outline-none transition-colors appearance-none">
                        <option value="">Select Level</option>
                        <option value="fresher">Fresher</option>
                        <option value="1-3yr">1-3 Years</option>
                        <option value="3-5yr">3-5 Years</option>
                        <option value="5yr+">5+ Years</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-md font-bold text-on-surface border-b border-outline-variant/20 pb-2">Skills</h4>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Technical Skills</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.skills?.technical?.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium flex items-center gap-1">
                            {skill} <button type="button" onClick={() => removeTag('skills', 'technical', idx)} className="hover:text-red-500"><Icon name="close" className="text-[14px]" /></button>
                          </span>
                        ))}
                      </div>
                      <input value={skillInput.tech} onChange={e => setSkillInput({...skillInput, tech: e.target.value})} onKeyDown={e => { if(e.key==='Enter') { e.preventDefault(); addTag('skills', 'technical', skillInput.tech); setSkillInput({...skillInput, tech: ''}); }}} className="w-full p-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:border-primary outline-none transition-colors" placeholder="Type a skill and press Enter" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-md font-bold text-on-surface border-b border-outline-variant/20 pb-2">Job Preferences</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">Work Mode</label>
                        <div className="flex gap-4">
                          {['remote', 'hybrid', 'on-site'].map(mode => (
                            <label key={mode} className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={formData.jobPreferences?.workMode?.includes(mode)} onChange={() => toggleCheckbox('jobPreferences', 'workMode', mode)} className="w-4 h-4 text-primary rounded border-outline-variant" />
                              <span className="text-sm capitalize">{mode}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Expected CTC</label>
                        <input value={formData.jobPreferences?.expectedCTC || ''} onChange={e => setFormData(p => ({...p, jobPreferences: {...p.jobPreferences, expectedCTC: e.target.value}}))} className="w-full p-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:border-primary outline-none transition-colors" placeholder="e.g. 8-12 LPA" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button onClick={handleProfileSave} className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold hover:-translate-y-0.5 hover:shadow-lg transition-all">Save Preferences</button>
                  </div>
                </div>
              )}

              {/* TAB 4: NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">Notifications</h3>
                    <p className="text-sm text-on-surface-variant mt-1">Manage what emails and alerts you receive.</p>
                  </div>

                  <div className="space-y-4 max-w-2xl">
                    {[
                      { key: 'platformUpdates', label: 'Platform Updates', desc: 'News about product and feature updates.' },
                      { key: 'roadmapReminders', label: 'Roadmap Reminders', desc: 'Weekly reminders to stay on track with your roadmap.' },
                      { key: 'weeklyReport', label: 'Weekly Progress Report', desc: 'Summary of your interview and ATS scores.' },
                      { key: 'interviewReminders', label: 'Interview Reminders', desc: 'Reminders for scheduled mock interviews.' },
                      { key: 'newFeatures', label: 'New Features & AI Models', desc: 'Alerts when we add new LLM models or tools.' }
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl hover:border-primary/30 transition-colors">
                        <div>
                          <p className="font-bold text-on-surface">{item.label}</p>
                          <p className="text-sm text-on-surface-variant">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={formData.notifications?.[item.key] || false} onChange={e => setFormData(p => ({...p, notifications: {...p.notifications, [item.key]: e.target.checked}}))} />
                          <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4">
                    <button onClick={handleNotificationSave} className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold hover:-translate-y-0.5 hover:shadow-lg transition-all">Save Notification Prefs</button>
                  </div>
                </div>
              )}

              {/* TAB 5: DANGER ZONE */}
              {activeTab === 'danger' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-red-600 flex items-center gap-2"><Icon name="warning" /> Danger Zone</h3>
                    <p className="text-sm text-on-surface-variant mt-1">Irreversible and destructive actions.</p>
                  </div>

                  <div className="border border-red-200 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-red-100 bg-red-50/30">
                      <h4 className="font-bold text-on-surface">Export My Data</h4>
                      <p className="text-sm text-on-surface-variant mt-1 mb-4">Download all your profile data, resumes, roadmaps, and interview history as JSON.</p>
                      <button onClick={() => window.open('/api/settings/export')} className="px-4 py-2 border border-outline bg-white rounded-lg font-bold text-sm hover:bg-surface-container-low transition-colors shadow-sm">Export Data</button>
                    </div>
                    
                    <div className="p-6 bg-red-50/30">
                      <h4 className="font-bold text-red-600">Delete Account</h4>
                      <p className="text-sm text-on-surface-variant mt-1 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                      
                      <div className="p-4 bg-white border border-red-200 rounded-xl space-y-4">
                        <p className="text-sm font-medium">To verify, type <strong className="text-red-600">DELETE</strong> below:</p>
                        <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} className="w-full p-3 bg-surface-container-lowest border border-red-200 rounded-xl focus:border-red-500 outline-none transition-colors" />
                        <button disabled={deleteConfirm !== 'DELETE'} onClick={handleDeleteAccount} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Delete Permanently</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
