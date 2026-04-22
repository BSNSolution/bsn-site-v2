import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function TermsPage() {
  return (
    <div className="page">
      <Header />

      <section className="legal shell">
        <div className="eyebrow mono">
          <span className="dot" />
          <span>Documento legal</span>
        </div>
        <h1>Termos de Uso</h1>
        <div className="doc glass">
          <div className="meta">VIGENTE DESDE · 01 ABR 2026</div>
          <h2>1. Aceitação</h2>
          <p>
            Ao acessar este site, você concorda com os termos abaixo. Se não concordar, por favor não utilize o site.
          </p>
          <h2>2. Conteúdo</h2>
          <p>
            Todo o conteúdo deste site é propriedade da BSN Solution e está protegido por direitos autorais. Você pode
            consultá-lo, mas não redistribuí-lo sem autorização.
          </p>
          <h2>3. Serviços</h2>
          <p>
            As informações sobre serviços são meramente descritivas. Contratos formais estabelecem escopo, prazos e
            responsabilidades de cada projeto.
          </p>
          <h2>4. Limitação de responsabilidade</h2>
          <p>
            A BSN Solution não se responsabiliza por decisões tomadas unicamente com base no conteúdo público do site.
          </p>
          <h2>5. Alterações</h2>
          <p>Estes termos podem ser atualizados. A data de vigência acima reflete a versão atual.</p>
          <h2>6. Foro</h2>
          <p>Fica eleito o foro de São Paulo / SP para dirimir eventuais controvérsias.</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
