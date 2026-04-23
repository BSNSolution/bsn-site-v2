import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Seo from '@/components/Seo'

export default function PrivacyPage() {
  return (
    <div className="page">
      <Seo
        title="Política de Privacidade"
        description="Como a BSN Solution coleta, usa e protege seus dados pessoais. Política alinhada à LGPD, cookies, compartilhamento, retenção e seus direitos como titular."
        path="/politica-privacidade"
      />
      <Header />

      <section className="legal shell">
        <div className="eyebrow mono">
          <span className="dot" />
          <span>Documento legal</span>
        </div>
        <h1>Política de Privacidade</h1>
        <div className="doc glass">
          <div className="meta">VIGENTE DESDE · 01 ABR 2026</div>
          <h2>1. Escopo</h2>
          <p>
            Esta política descreve como a BSN Solution coleta, usa e protege dados pessoais de visitantes e clientes em
            conformidade com a LGPD (Lei 13.709/2018).
          </p>
          <h2>2. Dados coletados</h2>
          <p>
            Coletamos apenas os dados necessários para atendê-lo: nome, e-mail, telefone e descrição do projeto que
            você compartilha voluntariamente em nossos formulários.
          </p>
          <h2>3. Uso</h2>
          <p>
            Seus dados são utilizados exclusivamente para responder sua solicitação e manter histórico de
            relacionamento comercial. Nunca compartilhamos com terceiros.
          </p>
          <h2>4. Seus direitos</h2>
          <p>
            Você pode solicitar acesso, correção, exclusão ou portabilidade dos seus dados a qualquer momento através
            de privacidade@bsnsolution.com.br.
          </p>
          <h2 id="cookies">5. Cookies</h2>
          <p>Utilizamos apenas cookies essenciais para funcionamento do site e analytics anonimizados.</p>
          <h2 id="lgpd">6. Contato do DPO</h2>
          <p>dpo@bsnsolution.com.br</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
