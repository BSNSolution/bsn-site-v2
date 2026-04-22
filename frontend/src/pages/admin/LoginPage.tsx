import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react'
import { authApi } from '@/lib/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      const token = res?.token
      if (!token) throw new Error('Credenciais inválidas')
      localStorage.setItem('bsn-auth-token', token)
      navigate('/admin')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Falha ao fazer login. Verifique as credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page login-page">
      <div className="bg-glass" />
      <div className="bg-aurora" />
      <div className="page-shards">
        <div className="shard s1" />
        <div className="shard s2" />
        <div className="shard s3" />
      </div>
      <div className="bg-grid" />
      <div className="bg-noise" />

      <div className="shell" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div className="glass" style={{ width: '100%', maxWidth: 440, padding: 40, position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src="/assets/logo.png" alt="BSN Solution" style={{ height: 48, width: 'auto', display: 'inline-block', marginBottom: 16 }} />
            <div className="mono" style={{ marginTop: 8 }}>ACESSO RESTRITO · PAINEL DE CONTROLE</div>
            <h1 style={{ fontSize: 32, letterSpacing: '-0.03em', fontWeight: 500, marginTop: 12 }}>
              Entre no <em className="prism" style={{ fontStyle: 'italic', fontWeight: 400 }}>admin</em>
            </h1>
            <p style={{ color: 'var(--ink-dim)', fontSize: 14, marginTop: 8 }}>
              Gerencie todo o conteúdo do site BSN Solution.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="field">
              <label>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', top: '50%', left: 14, transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--ink-faint)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bsnsolution.com.br"
                  required
                  disabled={loading}
                  autoComplete="email"
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            <div className="field">
              <label>Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', top: '50%', left: 14, transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--ink-faint)', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  style={{ paddingLeft: 40, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: 10,
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--ink-faint)',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 6,
                  }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'Entrando...' : (
                <>
                  <LogIn className="h-4 w-4" /> Entrar
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <a href="/" className="mono" style={{ textDecoration: 'none' }}>← Voltar ao site</a>
          </div>
        </div>
      </div>

      <style>{`
        .login-page .field { display: flex; flex-direction: column; gap: 6px; }
        .login-page .field label {
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.14em;
          color: var(--ink-faint);
          text-transform: uppercase;
        }
        .login-page .field input {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 14px 16px;
          color: var(--ink);
          font-family: inherit;
          font-size: 15px;
          outline: none;
          transition: 0.2s;
          width: 100%;
        }
        .login-page .field input:focus {
          border-color: rgba(122, 91, 255, 0.6);
          background: rgba(122, 91, 255, 0.06);
        }
      `}</style>
    </div>
  )
}
