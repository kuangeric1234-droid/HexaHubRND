import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import TenantProfile from './TenantProfile.jsx'

const EMPTY_FORM = {
  businessName: '',
  contactName: '',
  email: '',
  phone: '',
  abn: '',
  industry: '',
  country: 'Australia',
}

export default function Tenants() {
  const { tenants, addTenant, updateTenant, deleteTenant, leases, invoices, spaces, settings, addInvoice } = useOutletContext()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = tenants.filter((t) =>
    [t.businessName, t.contactName, t.email, t.industry]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  function openAdd() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(tenant) {
    setEditId(tenant.id)
    setForm({
      businessName: tenant.businessName ?? '',
      contactName: tenant.contactName ?? '',
      email: tenant.email ?? '',
      phone: tenant.phone ?? '',
      abn: tenant.abn ?? '',
      industry: tenant.industry ?? '',
      country: tenant.country ?? 'Australia',
    })
    setShowForm(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (editId) {
      updateTenant(editId, form)
    } else {
      addTenant(form)
    }
    setShowForm(false)
  }

  function handleDelete(id) {
    if (window.confirm('Delete this tenant? Any associated leases will remain.')) {
      deleteTenant(id)
    }
  }

  if (selectedTenant) {
    return (
      <>
        <TenantProfile
          tenant={selectedTenant}
          leases={leases ?? []}
          invoices={invoices ?? []}
          spaces={spaces ?? []}
          settings={settings}
          onBack={() => setSelectedTenant(null)}
          onEdit={() => openEdit(selectedTenant)}
          onAddInvoice={(data) => addInvoice({ ...data, tenantId: selectedTenant.id })}
        />
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-md w-full max-w-lg shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Edit Tenant</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={(e) => { handleSubmit(e); setSelectedTenant(tenants.find(t => t.id === editId) ?? selectedTenant) }} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Business Name *</label>
                    <input required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name</label>
                    <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ABN</label>
                    <input value={form.abn} onChange={(e) => setForm({ ...form, abn: e.target.value })} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Industry</label>
                    <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                    <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500 mt-1">{tenants.length} tenant profiles</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus size={15} /> Add Tenant
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search tenants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Business Name', 'Contact', 'Email', 'Phone', 'ABN', 'Industry', 'Since', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No tenants found.
                </td>
              </tr>
            )}
            {filtered.map((tenant) => (
              <tr key={tenant.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedTenant(tenant)}>
                <td className="px-4 py-3 font-medium text-gray-900 text-blue-700 hover:underline">{tenant.businessName}</td>
                <td className="px-4 py-3 text-gray-600">{tenant.contactName}</td>
                <td className="px-4 py-3 text-gray-600">{tenant.email}</td>
                <td className="px-4 py-3 text-gray-600">{tenant.phone}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{tenant.abn}</td>
                <td className="px-4 py-3 text-gray-600">{tenant.industry}</td>
                <td className="px-4 py-3 text-gray-500">
                  {tenant.createdAt ? format(parseISO(tenant.createdAt), 'dd/MM/yyyy') : '—'}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => openEdit(tenant)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(tenant.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">
                {editId ? 'Edit Tenant' : 'Add Tenant'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Business Name *</label>
                  <input
                    required
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name</label>
                  <input
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ABN</label>
                  <input
                    value={form.abn}
                    onChange={(e) => setForm({ ...form, abn: e.target.value })}
                    placeholder="XX XXX XXX XXX"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Industry</label>
                  <input
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                  <input
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800"
                >
                  <Check size={14} />
                  {editId ? 'Save Changes' : 'Add Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
