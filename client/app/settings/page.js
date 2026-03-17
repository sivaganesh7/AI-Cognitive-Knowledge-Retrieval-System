'use client';

import { api } from '@/lib/api';
import { ArrowLeft, Loader2, Save, Settings, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    display_name: '',
    email: '',
    username: '',
    bio: '',
    is_public: false,
  });

  useEffect(() => {
    let active = true;
    api.get('/api/user/profile')
      .then((res) => {
        if (!active) return;
        const user = res?.user || {};
        setForm({
          display_name: user.display_name || '',
          email: user.email || '',
          username: user.username || '',
          bio: user.bio || '',
          is_public: Boolean(user.is_public),
        });
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to load profile');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const payload = useMemo(() => ({
    display_name: form.display_name.trim(),
    username: form.username.trim() || null,
    bio: form.bio.trim() || null,
    is_public: !!form.is_public,
  }), [form]);

  const onSave = async (e) => {
    e.preventDefault();
    if (!payload.display_name) {
      toast.error('Profile name is required');
      return;
    }

    setSaving(true);
    try {
      await api.patch('/api/user/profile', payload);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted)' }}>
          <Loader2 className="animate-spin" size={16} /> Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm"
              style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
            >
              <ArrowLeft size={14} /> Back
            </Link>
            <div className="flex items-center gap-2">
              <Settings size={18} />
              <h1 className="text-xl font-bold">Settings</h1>
            </div>
          </div>
        </div>

        <form onSubmit={onSave} className="rounded-2xl p-5 sm:p-6 space-y-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <UserRound size={14} /> Profile
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Update your profile name and optional details. Email cannot be changed here.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Profile Name</span>
              <input
                value={form.display_name}
                onChange={(e) => update('display_name', e.target.value)}
                placeholder="Your display name"
                className="w-full rounded-xl px-3 py-2.5 text-sm border"
                style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                required
              />
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Email (Read-only)</span>
              <input
                value={form.email}
                readOnly
                disabled
                className="w-full rounded-xl px-3 py-2.5 text-sm border opacity-80"
                style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Username (Optional)</span>
              <input
                value={form.username}
                onChange={(e) => update('username', e.target.value.toLowerCase())}
                placeholder="username"
                className="w-full rounded-xl px-3 py-2.5 text-sm border"
                style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              />
            </label>

            <label className="space-y-1.5 flex items-end">
              <span className="inline-flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm"
                style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(e) => update('is_public', e.target.checked)}
                />
                Make profile public
              </span>
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Bio (Optional)</span>
              <textarea
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
                placeholder="Tell people a little about yourself"
                rows={4}
                className="w-full rounded-xl px-3 py-2.5 text-sm border resize-y"
                style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
