import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Upload, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Sponsor {
  id: number;
  name: string;
  logo: string;
  website?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  twitch?: string;
  kick?: string;
  display_order: number;
  is_active: boolean;
}

const SponsorManager: React.FC = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { themeConfig } = useTheme();

  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    website: '',
    whatsapp: '',
    instagram: '',
    facebook: '',
    youtube: '',
    twitch: '',
    kick: '',
    is_active: true
  });

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      const response = await fetch('/api/sponsors/get-all.php');
      const data = await response.json();
      if (data.success) {
        setSponsors(data.data);
      }
    } catch (error) {
      console.error('Error al cargar sponsors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId ? '/api/sponsors/update.php' : '/api/sponsors/create.php';
      const method = editingId ? 'PUT' : 'POST';

      const payload = editingId
        ? { ...formData, id: editingId }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        await fetchSponsors();
        resetForm();
      } else {
        alert(data.message || 'Error al guardar el sponsor');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el sponsor');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este sponsor?')) return;

    try {
      const response = await fetch('/api/sponsors/delete.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const data = await response.json();

      if (data.success) {
        await fetchSponsors();
      } else {
        alert(data.message || 'Error al eliminar el sponsor');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el sponsor');
    }
  };

  const handleEdit = (sponsor: Sponsor) => {
    setFormData({
      name: sponsor.name,
      logo: sponsor.logo,
      website: sponsor.website || '',
      whatsapp: sponsor.whatsapp || '',
      instagram: sponsor.instagram || '',
      facebook: sponsor.facebook || '',
      youtube: sponsor.youtube || '',
      twitch: sponsor.twitch || '',
      kick: sponsor.kick || '',
      is_active: sponsor.is_active
    });
    setEditingId(sponsor.id);
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/sponsors/upload-image.php', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({ ...prev, logo: data.url }));
      } else {
        alert(data.message || 'Error al subir la imagen');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/sponsors/update.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus })
      });

      const data = await response.json();

      if (data.success) {
        await fetchSponsors();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleReorder = async (id: number, direction: 'up' | 'down') => {
    const currentIndex = sponsors.findIndex(s => s.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sponsors.length) return;

    const currentSponsor = sponsors[currentIndex];
    const targetSponsor = sponsors[newIndex];

    try {
      await Promise.all([
        fetch('/api/sponsors/update.php', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentSponsor.id, display_order: targetSponsor.display_order })
        }),
        fetch('/api/sponsors/update.php', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: targetSponsor.id, display_order: currentSponsor.display_order })
        })
      ]);

      await fetchSponsors();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      logo: '',
      website: '',
      whatsapp: '',
      instagram: '',
      facebook: '',
      youtube: '',
      twitch: '',
      kick: '',
      is_active: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto"
          style={{ borderColor: `${themeConfig.colors.primary} transparent transparent transparent` }}
        ></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: themeConfig.colors.text }}>
          Gestión de Sponsors
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: themeConfig.colors.primary,
            color: 'white'
          }}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Nuevo Sponsor'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-xl border space-y-4"
          style={{
            backgroundColor: `${themeConfig.colors.surface}40`,
            borderColor: themeConfig.colors.border
          }}
        >
          <div>
            <label className="block mb-2" style={{ color: themeConfig.colors.text }}>
              Nombre del Sponsor *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: `${themeConfig.colors.surface}80`,
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text
              }}
            />
          </div>

          <div>
            <label className="block mb-2" style={{ color: themeConfig.colors.text }}>
              Logo *
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="URL del logo o sube una imagen"
                required
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: `${themeConfig.colors.surface}80`,
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text
                }}
              />
              <label
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors"
                style={{
                  backgroundColor: `${themeConfig.colors.surface}80`,
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text
                }}
              >
                <Upload className="w-4 h-4" />
                {uploadingImage ? 'Subiendo...' : 'Subir Imagen'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            </div>
            {formData.logo && (
              <div className="mt-2 p-4 rounded-lg bg-white/5">
                <img src={formData.logo} alt="Preview" className="max-h-32 mx-auto" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2" style={{ color: themeConfig.colors.text }}>
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: `${themeConfig.colors.surface}80`,
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text
                }}
              />
            </div>

            <div>
              <label className="block mb-2" style={{ color: themeConfig.colors.text }}>
                WhatsApp
              </label>
              <input
                type="url"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="https://wa.me/56..."
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: `${themeConfig.colors.surface}80`,
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text
                }}
              />
            </div>

            <div>
              <label className="block mb-2" style={{ color: themeConfig.colors.text }}>
                Instagram
              </label>
              <input
                type="url"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="https://instagram.com/..."
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: `${themeConfig.colors.surface}80`,
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text
                }}
              />
            </div>

            <div>
              <label className="block mb-2" style={{ color: themeConfig.colors.text }}>
                Facebook
              </label>
              <input
                type="url"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                placeholder="https://facebook.com/..."
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: `${themeConfig.colors.surface}80`,
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text
                }}
              />
            </div>

            <div>
              <label className="block mb-2" style={{ color: themeConfig.colors.text }}>
                YouTube
              </label>
              <input
                type="url"
                value={formData.youtube}
                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                placeholder="https://youtube.com/..."
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: `${themeConfig.colors.surface}80`,
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text
                }}
              />
            </div>

            <div>
              <label className="block mb-2" style={{ color: themeConfig.colors.text }}>
                Twitch
              </label>
              <input
                type="url"
                value={formData.twitch}
                onChange={(e) => setFormData({ ...formData, twitch: e.target.value })}
                placeholder="https://twitch.tv/..."
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: `${themeConfig.colors.surface}80`,
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text
                }}
              />
            </div>

            <div>
              <label className="block mb-2" style={{ color: themeConfig.colors.text }}>
                Kick
              </label>
              <input
                type="url"
                value={formData.kick}
                onChange={(e) => setFormData({ ...formData, kick: e.target.value })}
                placeholder="https://kick.com/..."
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: `${themeConfig.colors.surface}80`,
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="is_active" style={{ color: themeConfig.colors.text }}>
              Sponsor activo
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: themeConfig.colors.primary,
                color: 'white'
              }}
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Actualizar' : 'Crear'} Sponsor
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: `${themeConfig.colors.surface}80`,
                  color: themeConfig.colors.text
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <div className="space-y-4">
        {sponsors.map((sponsor, index) => (
          <div
            key={sponsor.id}
            className="p-4 rounded-xl border flex items-center gap-4"
            style={{
              backgroundColor: `${themeConfig.colors.surface}40`,
              borderColor: themeConfig.colors.border,
              opacity: sponsor.is_active ? 1 : 0.6
            }}
          >
            <img
              src={sponsor.logo}
              alt={sponsor.name}
              className="w-20 h-20 object-contain rounded-lg bg-white/5 p-2"
            />

            <div className="flex-1">
              <h3 className="font-bold" style={{ color: themeConfig.colors.text }}>
                {sponsor.name}
              </h3>
              <p className="text-sm" style={{ color: themeConfig.colors.textSecondary }}>
                {sponsor.is_active ? 'Activo' : 'Inactivo'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleReorder(sponsor.id, 'up')}
                disabled={index === 0}
                className="p-2 rounded-lg transition-colors disabled:opacity-30"
                style={{
                  backgroundColor: `${themeConfig.colors.surface}80`,
                  color: themeConfig.colors.text
                }}
              >
                <ArrowUp className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleReorder(sponsor.id, 'down')}
                disabled={index === sponsors.length - 1}
                className="p-2 rounded-lg transition-colors disabled:opacity-30"
                style={{
                  backgroundColor: `${themeConfig.colors.surface}80`,
                  color: themeConfig.colors.text
                }}
              >
                <ArrowDown className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleToggleActive(sponsor.id, sponsor.is_active)}
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: `${themeConfig.colors.surface}80`,
                  color: themeConfig.colors.text
                }}
              >
                {sponsor.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>

              <button
                onClick={() => handleEdit(sponsor)}
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: themeConfig.colors.primary,
                  color: 'white'
                }}
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDelete(sponsor.id)}
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white'
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {sponsors.length === 0 && (
          <div
            className="text-center py-8 rounded-xl border"
            style={{
              backgroundColor: `${themeConfig.colors.surface}40`,
              borderColor: themeConfig.colors.border,
              color: themeConfig.colors.textSecondary
            }}
          >
            No hay sponsors registrados
          </div>
        )}
      </div>
    </div>
  );
};

export default SponsorManager;
