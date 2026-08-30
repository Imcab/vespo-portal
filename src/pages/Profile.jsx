import { useState, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import { Camera } from 'lucide-react';

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

export default function Profile() {
  const { user, member, refreshMember } = useAuth();
  const fileInputRef = useRef(null);

  const [nombre, setNombre] = useState(member?.nombre || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('miembros')
      .update({ nombre: nombre.trim() })
      .eq('user_id', user.id);

    if (error) setMessage(error.message);
    else {
      await refreshMember();
      setMessage('Saved.');
    }
    setSaving(false);
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('');

    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setMessage(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const fotoUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error } = await supabase.from('miembros').update({ foto_url: fotoUrl }).eq('user_id', user.id);

    if (error) setMessage(error.message);
    else await refreshMember();
    setUploading(false);
  }

  if (!member) {
    return (
      <div className="mx-auto max-w-lg px-5 py-12 sm:px-8 sm:py-16">
        <div className="skeleton h-8 w-1/2 animate-shimmer rounded-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="mb-10 text-[22px] font-semibold tracking-tight text-ink">My profile</h1>

      <div className="mb-8 flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="group relative h-20 w-20 shrink-0 rounded-full disabled:opacity-60"
        >
          {member?.foto_url ? (
            <img
              src={member.foto_url}
              alt={member.nombre}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-[20px] font-semibold text-brown-600">
              {initials(nombre)}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/40 opacity-0 transition-opacity duration-350 ease-emil group-hover:opacity-100">
            <Camera size={20} strokeWidth={1.75} className="text-white" />
          </span>
        </button>
        <div className="text-[13px] text-ink-secondary">
          {uploading ? 'Uploading…' : 'Click the photo to change it'}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-secondary">Name</span>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-secondary">Email</span>
          <input
            type="email"
            disabled
            value={user.email}
            className="rounded-control border border-line bg-surface-soft px-3.5 py-2.5 text-[14px] text-ink-secondary"
          />
        </label>

        {message && <p className="text-[13px] text-ink-secondary">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-1 inline-flex items-center justify-center rounded-full bg-brand-500 px-4 py-2.5 text-[14px] font-medium text-ink transition-[background-color,transform] duration-350 ease-emil hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
