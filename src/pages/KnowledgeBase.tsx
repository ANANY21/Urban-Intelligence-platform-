import React, { useState, useEffect } from 'react';
import type { KnowledgeDocument, KnowledgeStatus, KnowledgeSearchChunk } from '../types';
import { 
  getKnowledgeBaseStatus, 
  listKnowledgeDocuments, 
  uploadKnowledgeDocument, 
  deleteKnowledgeDocument, 
  searchKnowledgeDocuments 
} from '../services/api';
import { 
  BookOpen, 
  Upload, 
  Search, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Database, 
  ExternalLink, 
  Plus, 
  Sparkles, 
  Filter,
  Radio,
  FileCheck,
  FolderOpen
} from 'lucide-react';

export const KnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [status, setStatus] = useState<KnowledgeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Search test
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeSearchChunk[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('flood-preparedness');
  const [uploadSourceUrl, setUploadSourceUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsData, statusData] = await Promise.all([
        listKnowledgeDocuments(),
        getKnowledgeBaseStatus(),
      ]);
      setDocuments(docsData);
      setStatus(statusData);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setSearchLoading(true);
      const cat = selectedCategory === 'all' ? undefined : selectedCategory;
      const res = await searchKnowledgeDocuments(searchQuery.trim(), 4, cat);
      setSearchResults(res.results || []);
    } catch {
      // Ignore
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document and all its indexed vector chunks?')) {
      return;
    }
    try {
      await deleteKnowledgeDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to ingest.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);
      const res = await uploadKnowledgeDocument(
        uploadFile,
        uploadTitle.trim() || undefined,
        uploadCategory,
        uploadSourceUrl.trim() || undefined
      );
      setUploadSuccess(`Ingested ${res.chunk_count} vector chunks successfully!`);
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadTitle('');
        setUploadSourceUrl('');
        setUploadSuccess(null);
        loadData();
      }, 1400);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = selectedCategory === 'all'
    ? documents
    : documents.filter((d) => d.category.toLowerCase() === selectedCategory.toLowerCase());

  const CATEGORIES = [
    { id: 'all', label: 'All Documents' },
    { id: 'flood-preparedness', label: 'Flood Preparedness' },
    { id: 'meteorology', label: 'Meteorology & Rainfall' },
    { id: 'stormwater-infrastructure', label: 'Stormwater Infrastructure' },
    { id: 'traffic-guidelines', label: 'Traffic & Diversions' },
    { id: 'model-documentation', label: 'ML Architecture' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 1. Header Banner */}
      <div className="relative bg-gradient-to-r from-[#101827] via-[#142338] to-[#0A101D] border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#35D9F5]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono tracking-widest text-[#35D9F5] uppercase flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                RETRIEVAL-AUGMENTED GENERATION (RAG) KNOWLEDGE BASE
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white font-sans">
              Operational SOP & Document Inventory
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Trusted standard operating procedures, reservoir gate protocols, IMD classifications, and ML architecture docs powering the AI assistant.
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="py-2.5 px-4 bg-gradient-to-r from-[#35D9F5] to-blue-600 hover:from-[#35D9F5]/90 hover:to-blue-500 text-[#080D16] font-bold rounded-xl shadow-lg shadow-[#35D9F5]/20 flex items-center gap-2 text-xs transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Ingest Document (PDF / MD / TXT)</span>
          </button>
        </div>
      </div>

      {/* 2. Vector Store Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#101827] border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>INDEXED DOCUMENTS</span>
            <BookOpen className="w-4 h-4 text-[#35D9F5]" />
          </div>
          <div className="text-2xl font-bold text-white font-sans">
            {status?.total_documents ?? documents.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Official GCC/IMD Publications</p>
        </div>

        <div className="bg-[#101827] border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>EMBEDDED CHUNKS</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-sans">
            {status?.total_chunks ?? 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Overlapping text chunks (650 chars)</p>
        </div>

        <div className="bg-[#101827] border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>VECTOR INDEX ENGINE</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-white truncate font-sans">
            {status?.vector_store ?? 'SQLite Cosine Index'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">L2-Normalized Cosine Similarity</p>
        </div>

        <div className="bg-[#101827] border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>EMBEDDING MODEL</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white truncate font-sans">
            {status?.embedding_provider ?? 'Local Dense Vector (128d)'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Zero latency &amp; zero external API cost</p>
        </div>
      </div>

      {/* 3. Live Semantic Search Tester */}
      <div className="bg-[#101827] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-[#35D9F5]" />
          <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
            Semantic Vector Search Inspection
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Test semantic retrieval across all indexed documents to verify vector cosine similarity rankings.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g. Chembarambakkam reservoir discharge gate SOP during depression..."
            className="flex-1 px-4 py-2.5 bg-[#080D16] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#35D9F5]"
          />
          <button
            type="submit"
            disabled={searchLoading || !searchQuery.trim()}
            className="px-5 py-2.5 bg-[#35D9F5] text-[#080D16] font-bold text-xs rounded-xl hover:bg-[#35D9F5]/90 disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            {searchLoading ? 'Searching...' : 'Run Vector Search'}
          </button>
        </form>

        {/* Search Results Preview */}
        {searchResults.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-400">
              Retrieved Chunks ({searchResults.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {searchResults.map((chunk, cIdx) => (
                <div
                  key={cIdx}
                  className="bg-[#080D16] border border-slate-800 p-3 rounded-xl text-xs"
                >
                  <div className="flex items-center justify-between text-[#35D9F5] font-semibold mb-1">
                    <span className="truncate">{chunk.document_title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#35D9F5]/10 rounded text-slate-300">
                      Score: {Math.round(chunk.similarity_score * 100)}%
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] font-sans italic line-clamp-3">
                    "{chunk.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
              selectedCategory === cat.id
                ? 'bg-[#35D9F5] text-[#080D16] font-bold shadow-md shadow-[#35D9F5]/20'
                : 'bg-[#101827] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 5. Documents Inventory Table */}
      <div className="bg-[#101827] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0A101D] border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Document Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">File Type</th>
                <th className="py-3.5 px-4">Vector Chunks</th>
                <th className="py-3.5 px-4">Ingested Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No documents found for this category.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#142338]/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-[#35D9F5] flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-white">{doc.title}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{doc.filename}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] uppercase border border-slate-700">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 font-mono text-[10px] uppercase border border-blue-800">
                        {doc.file_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {doc.chunk_count} chunks
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {doc.created_at ? doc.created_at.split('T')[0] : 'Seeded'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.source_url && (
                          <a
                            href={doc.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-slate-400 hover:text-[#35D9F5]"
                            title="Open external source"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete from vector store"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Document Ingestion Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101827] border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative animate-scale-in">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#35D9F5]" />
              Ingest Document into RAG Vector Store
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Upload PDF, Markdown, or Plain Text SOP documents. The system automatically performs overlapping chunking and local cosine embedding indexing.
            </p>

            {uploadSuccess && (
              <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {uploadError && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  File (.pdf, .md, .txt)
                </label>
                <input
                  type="file"
                  accept=".pdf,.md,.txt"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#142338] file:text-[#35D9F5] hover:file:bg-[#1b2f4a] cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Chembarambakkam Reservoir Gate SOP 2026"
                  className="w-full px-3 py-2 bg-[#080D16] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#35D9F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#080D16] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#35D9F5]"
                  >
                    <option value="flood-preparedness">Flood Preparedness</option>
                    <option value="meteorology">Meteorology & Rainfall</option>
                    <option value="stormwater-infrastructure">Stormwater Infrastructure</option>
                    <option value="traffic-guidelines">Traffic Guidelines</option>
                    <option value="model-documentation">Model Architecture</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Source URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={uploadSourceUrl}
                    onChange={(e) => setUploadSourceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-[#080D16] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#35D9F5]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-[#35D9F5] text-[#080D16] font-bold text-xs rounded-xl hover:bg-[#35D9F5]/90 disabled:opacity-50"
                >
                  {uploading ? 'Chunking & Embedding...' : 'Ingest Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
