/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { X, Volume2, VolumeX, User, ShieldCheck, Upload, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  muted: boolean;
  onToggleMute: () => void;
  triggerNotification: (
    title: string,
    msg: string,
    type: 'deposit' | 'withdrawal' | 'bonus' | 'jackpot' | 'tournament' | 'vip' | 'general'
  ) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  userProfile,
  setUserProfile,
  muted,
  onToggleMute,
  triggerNotification
}: SettingsModalProps) {
  const [fullName, setFullName] = useState<string>(userProfile.fullName || 'Frank Janal');
  const [username, setUsername] = useState<string>(userProfile.username || 'francypendy');
  const [avatarInput, setAvatarInput] = useState<string>(userProfile.avatar || 'FP');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isImageAvatar = (str: string) => {
    return str && (str.startsWith('data:image/') || str.startsWith('http://') || str.startsWith('https://'));
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      triggerNotification('⚠️ INVALID FILE', 'Please upload a valid image file (PNG, JPG, SVG).', 'general');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setAvatarInput(dataUrl);
        triggerNotification('🎨 PHOTO LOADED', 'Your custom avatar photo has been loaded. Click "Save Settings" to confirm.', 'general');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      triggerNotification('⚠️ ERROR', 'Full username cannot be empty.', 'general');
      return;
    }

    const trimmedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!trimmedUsername) {
      triggerNotification('⚠️ ERROR', 'Platform username identifier cannot be empty.', 'general');
      return;
    }

    setUserProfile((prev) => {
      const nextProfile = {
        ...prev,
        fullName: trimmedName,
        username: trimmedUsername,
        avatar: avatarInput
      };
      
      // Save to localStorage to persist user customization
      try {
        localStorage.setItem('casinohub_custom_settings_profile', JSON.stringify({
          fullName: nextProfile.fullName,
          username: nextProfile.username,
          avatar: nextProfile.avatar
        }));
      } catch (e) {}

      return nextProfile;
    });

    triggerNotification(
      '⚙️ SETTINGS UPDATED',
      'Your sound preferences, full user name, username ID, and custom profile photo have been saved successfully!',
      'general'
    );
    onClose();
  };

  // Pre-configured simple quick colors as initials avatars option
  const presetInitials = ['FP', 'AV', 'CH', 'JD', 'KE', 'VIP'];

  return (
    <div id="settings-modal-overlay" className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 select-none animate-fadeIn font-sans">
      <div id="settings-modal-container" className="w-full max-w-md bg-[#141518] border border-zinc-800 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.85)] transform scale-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-zinc-900 to-[#141518] border-b border-[#212327] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#e21515]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Player Settings</h3>
              <p className="text-[10px] text-gray-400 font-mono">Personalize gaming controls & card profile</p>
            </div>
          </div>
          <button 
            id="settings-close-button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/40 border border-[#24262f] text-gray-400 hover:text-white flex items-center justify-center transition-colors hover:bg-black/80 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body content scrollable */}
        <div className="p-4 overflow-y-auto space-y-4 text-left scrollbar-thin scrollbar-thumb-zinc-800">
          
          {/* Section 1: Audio Effects */}
          <div className="space-y-2 bg-black/20 p-3.5 rounded-xl border border-zinc-800/60">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black block">Sound system effects</label>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-white block">Environment Sound Effects</span>
                <span className="text-[10.5px] text-gray-400 block font-normal leading-tight">Mute or unmute crash multipliers & background ambient synthesizer audio.</span>
              </div>
              <button
                type="button"
                onClick={onToggleMute}
                className={`px-3 py-1.5 rounded-lg border text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                  muted 
                    ? 'border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-950/40' 
                    : 'border-[#00e600]/20 bg-[#00e600]/10 text-[#00e600] hover:bg-[#00e600]/20'
                }`}
              >
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{muted ? 'Muted' : 'Unmuted'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Edit Full Name */}
          <div className="space-y-4 bg-black/20 p-3.5 rounded-xl border border-zinc-800/60">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black block">Full User Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-500/50">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. FRANK JANAL"
                  className="w-full pl-9 pr-3 py-2.5 bg-black/40 border border-zinc-800 focus:border-red-500 rounded-lg text-white font-bold text-xs outline-none transition-all focus:ring-1 focus:ring-red-500/20 uppercase"
                />
              </div>
              <p className="text-[9px] text-[#8e9099] leading-tight">This will replace the active display name shown in multiplayer leaderboards & cash logs.</p>
            </div>

            <div className="space-y-2 pt-1 border-t border-zinc-800/50">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black block">Platform Username ID</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-500/50 font-bold font-mono text-xs">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. francypendy"
                  className="w-full pl-7 pr-3 py-2.5 bg-black/40 border border-zinc-800 focus:border-red-500 rounded-lg text-white font-bold text-xs outline-none transition-all focus:ring-1 focus:ring-red-500/20 lowercase"
                />
              </div>
              <p className="text-[9px] text-[#8e9099] leading-tight">Your unique user identity used in player tracking & referral invitations.</p>
            </div>
          </div>

          {/* Section 3: Change and Upload Icon Photo */}
          <div className="space-y-3 bg-black/20 p-3.5 rounded-xl border border-zinc-800/60">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black block">Upload profile picture / photo</label>
            
            {/* Live Profile preview */}
            <div className="flex items-center gap-4 py-1">
              <div id="settings-avatar-live-preview" className="relative shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#e21515] to-[#ff4747] border-2 border-red-500 flex items-center justify-center font-black text-2xl text-white shadow-[0_0_15px_rgba(226,21,21,0.3)] overflow-hidden">
                  {isImageAvatar(avatarInput) ? (
                    <img 
                      src={avatarInput} 
                      alt="Avatar Preview" 
                      className="w-full h-full object-cover shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    avatarInput
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 rounded-full border border-black flex items-center justify-center text-white text-[10px] font-bold">
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex-1 space-y-1 text-left">
                <span className="text-[11px] font-bold text-white block">Active Display Photo</span>
                <span className="text-[9.5px] text-gray-400 block leading-normal">
                  Upload an image from your computer, or drag/drop it below to substitute your profile photo. You can also pick standard initials presets.
                </span>
              </div>
            </div>

            {/* Drag & Drop File Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                dragActive 
                  ? 'border-red-500 bg-red-950/15' 
                  : 'border-zinc-800 bg-black/35 hover:bg-black/55 hover:border-zinc-700'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-6 h-6 mx-auto text-gray-400 animate-pulse mb-1.5" />
              <span className="text-xs font-black text-rose-100 uppercase tracking-wide block">Click to select or drag & drop</span>
              <span className="text-[9.5px] text-gray-400 block mt-0.5">PNG, JPG or SVG formats supported</span>
            </div>

            {/* Initials presets shortcut */}
            <div className="space-y-1">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Or choose a preset text initials:</span>
              <div className="flex flex-wrap gap-1.5">
                {presetInitials.map((initial) => (
                  <button
                    key={initial}
                    type="button"
                    onClick={() => setAvatarInput(initial)}
                    className={`px-2.5 py-1 text-[10.5px] font-black rounded-lg transition-colors cursor-pointer ${
                      avatarInput === initial
                        ? 'bg-[#e21515] text-white'
                        : 'bg-zinc-900 border border-zinc-800 text-gray-450 hover:text-white'
                    }`}
                  >
                    {initial}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Secure Verification */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500 bg-[#0e160e] py-2.5 px-3 rounded-lg border border-[#2b5c2a]/30">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Customize values. These parameters are stored only on your local browser machine.</span>
          </div>

        </div>

        {/* Actions Footer */}
        <div className="p-3 bg-gradient-to-t from-black/40 to-transparent border-t border-[#212327] flex gap-2.5 px-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-zinc-805 hover:bg-zinc-800 border border-zinc-800 text-gray-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 bg-[#e21515] hover:bg-[#ff1e1e] text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-[0_0_15px_rgba(226,21,21,0.25)] flex items-center justify-center gap-1.5 border hover:border-red-400 border-red-500/20 active:scale-95 duration-100"
          >
            <Check className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>

      </div>
    </div>
  );
}
