import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { X, Clock, Bell, Palette, Database, Download, Upload, Trash2, Volume2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export function SettingsModal() {
  const { settings, updateSettings, setSettingsOpen, exportData, importData, resetData } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        importData(content);
        alert('Data imported successfully!');
      };
      reader.readAsText(file);
    }
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pomodoro-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to delete all your tasks, projects, and history? This cannot be undone.')) {
      resetData();
      alert('All data has been reset.');
    }
  };

  const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="mb-8">
      <div className="flex items-center text-[var(--color-primary)] mb-4">
        <Icon className="w-5 h-5 mr-2" />
        <h3 className="font-medium text-lg">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const SelectRow = ({ label, value, onChange, options }: any) => (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  const NumberRow = ({ label, value, onChange, min = 1 }: any) => (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <input
        type="number"
        min={min}
        step={1}
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const rawValue = e.target.value;
          const nextValue = rawValue === '' ? min : Number(rawValue);
          onChange(Number.isFinite(nextValue) ? Math.max(min, Math.floor(nextValue)) : min);
        }}
        className="w-24 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm text-right focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]"
      />
    </div>
  );

  const ToggleRow = ({ label, checked, onChange }: any) => (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <button 
        onClick={() => onChange(!checked)}
        className={cn(
          "w-10 h-5 rounded-full transition-colors relative",
          checked ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
        )}
      >
        <div className={cn(
          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
          checked ? "left-[22px]" : "left-0.5"
        )} />
      </button>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) setSettingsOpen(false);
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[var(--color-surface)] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)] shrink-0">
          <h2 className="text-2xl font-semibold">Settings</h2>
          <button 
            onClick={() => setSettingsOpen(false)}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          
          <Section title="Timer" icon={Clock}>
            <SelectRow 
              label="Pomodoro Length" 
              value={settings.pomodoroLength} 
              onChange={(v: string) => updateSettings({ pomodoroLength: parseInt(v) })}
              options={[15, 20, 25, 30, 45, 60].map(n => ({ value: n, label: `${n} Minutes` }))}
            />
            <SelectRow 
              label="Short Break Length" 
              value={settings.shortBreakLength} 
              onChange={(v: string) => updateSettings({ shortBreakLength: parseInt(v) })}
              options={[3, 5, 10, 15].map(n => ({ value: n, label: `${n} Minutes` }))}
            />
            <SelectRow 
              label="Long Break Length" 
              value={settings.longBreakLength} 
              onChange={(v: string) => updateSettings({ longBreakLength: parseInt(v) })}
              options={[10, 15, 20, 25, 30].map(n => ({ value: n, label: `${n} Minutes` }))}
            />
            <NumberRow 
              label="Long Break After" 
              value={settings.longBreakAfter} 
              onChange={(v: number) => updateSettings({ longBreakAfter: v })}
              min={1}
            />
            <div className="h-px bg-[var(--color-border)] my-4" />
            <ToggleRow 
              label="Auto Start of Next Pomodoro" 
              checked={settings.autoStartPomodoro} 
              onChange={(v: boolean) => updateSettings({ autoStartPomodoro: v })}
            />
            <ToggleRow 
              label="Auto Start of Break" 
              checked={settings.autoStartBreak} 
              onChange={(v: boolean) => updateSettings({ autoStartBreak: v })}
            />
            <ToggleRow 
              label="Disable Break" 
              checked={settings.disableBreak} 
              onChange={(v: boolean) => updateSettings({ disableBreak: v })}
            />
          </Section>

          <Section title="Audio & Notifications" icon={Bell}>
            <SelectRow 
              label="Alarm Sound" 
              value={settings.alarmSound} 
              onChange={(v: string) => updateSettings({ alarmSound: v })}
              options={[
                { value: 'bell', label: 'Bell' },
                { value: 'digital', label: 'Digital' },
                { value: 'birds', label: 'Birds' },
                { value: 'none', label: 'None' }
              ]}
            />
            <SelectRow 
              label="Ticking Sound" 
              value={settings.tickSound} 
              onChange={(v: string) => updateSettings({ tickSound: v })}
              options={[
                { value: 'none', label: 'None' },
                { value: 'tick', label: 'Tick Tock' },
                { value: 'white_noise', label: 'White Noise' }
              ]}
            />
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-muted)] flex items-center">
                <Volume2 className="w-4 h-4 mr-2" />
                Volume
              </span>
              <input 
                type="range" 
                min="0" max="100" 
                value={settings.volume}
                onChange={(e) => updateSettings({ volume: parseInt(e.target.value) })}
                className="w-32 accent-[var(--color-primary)]"
              />
            </div>
            <div className="h-px bg-[var(--color-border)] my-4" />
            <ToggleRow 
              label="Desktop Notifications" 
              checked={settings.desktopNotifications} 
              onChange={(v: boolean) => {
                if (v && Notification.permission !== 'granted') {
                  Notification.requestPermission().then(perm => {
                    if (perm === 'granted') updateSettings({ desktopNotifications: true });
                  });
                } else {
                  updateSettings({ desktopNotifications: v });
                }
              }}
            />
          </Section>

          <Section title="Appearance" icon={Palette}>
            <SelectRow 
              label="Theme" 
              value={settings.theme} 
              onChange={(v: any) => updateSettings({ theme: v })}
              options={[
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
                { value: 'system', label: 'System' }
              ]}
            />
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-muted)]">Accent Color</span>
              <div className="flex space-x-2">
                {['#f43f5e', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'].map(color => (
                  <button
                    key={color}
                    onClick={() => updateSettings({ accentColor: color })}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-transform",
                      settings.accentColor === color ? "border-white scale-110" : "border-transparent hover:scale-110"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </Section>

          <Section title="Data & Productivity" icon={Database}>
            <NumberRow 
              label="Daily Pomodoro Goal" 
              value={settings.dailyGoal} 
              onChange={(v: number) => updateSettings({ dailyGoal: v })}
              min={1}
            />
            <SelectRow 
              label="Week Starts On" 
              value={settings.weekStartsOn} 
              onChange={(v: string) => updateSettings({ weekStartsOn: parseInt(v) as 0 | 1 })}
              options={[
                { value: 1, label: 'Monday' },
                { value: 0, label: 'Sunday' }
              ]}
            />
            <div className="h-px bg-[var(--color-border)] my-4" />
            <div className="flex flex-col space-y-3">
              <button 
                onClick={handleExport}
                className="flex items-center justify-center w-full py-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Backup
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImport} 
                accept=".json" 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-full py-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Backup
              </button>

              <button 
                onClick={handleReset}
                className="flex items-center justify-center w-full py-2.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors mt-4"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Reset All Data
              </button>
            </div>
          </Section>

        </div>
      </motion.div>
    </div>
  );
}
