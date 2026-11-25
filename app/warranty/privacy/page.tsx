// v0.1.0 | 2026-11-25 | 全球保固頁隱私政策：沿用業務 privacy.html v0.3.0（負責人已確認），依新版補上
//   諮詢維修收集的電話、問題描述；資料改存本站資料庫（不再是 Google）。改動處仍需負責人或法務再確認。
import Link from 'next/link'

export const metadata = { title: 'Privacy Policy' }
const MAIL = 'service@lemeng.com.tw'

export default function Page() {
  return (
    <main className="wty-main wide">
      <Link href="/warranty" className="back">← Warranty &amp; Support</Link>
      <article className="wg policy">
        <h1>Privacy Policy</h1>
        <p className="lead">Warranty registration and support requests · Last updated: 25 November 2026</p>

        <p>This policy explains how Lemeng Limited Company (&quot;we&quot;, &quot;us&quot;) handles the personal information you give us when you register a product for warranty or send us a support request on these pages.</p>

        <h2>1. Who is responsible for your information</h2>
        <p>Lemeng Limited Company, 11F., No. 216, Fuhui Rd., Xinzhuang Dist., New Taipei City 242, Taiwan.<br />
          Contact for privacy questions: <a href={`mailto:${MAIL}`}>{MAIL}</a>.</p>

        <h2>2. What we collect</h2>
        <table>
          <thead><tr><th>Information</th><th>Why we need it</th></tr></thead>
          <tbody>
            <tr><td>Name, email address</td><td>To identify your registration or request and contact you about warranty or after-sales support.</td></tr>
            <tr><td>Country / region</td><td>To apply the correct warranty terms and arrange service.</td></tr>
            <tr><td>Product, serial number (optional)</td><td>To know which product is covered.</td></tr>
            <tr><td>Where you bought it, order number, purchase date</td><td>To confirm the purchase and work out the warranty period.</td></tr>
            <tr><td>Description of the problem, phone number (optional), registration number (optional)</td><td>To understand and handle your support request.</td></tr>
          </tbody>
        </table>
        <p>We do not ask for payment details, and we do not collect information from these pages through advertising or tracking cookies.</p>

        <h2>3. How we use it</h2>
        <ul>
          <li>To record your warranty registration and give you a registration number.</li>
          <li>To receive and answer your support request.</li>
          <li>To verify your purchase and provide warranty and after-sales service.</li>
          <li>To contact you about your registration or a service request.</li>
        </ul>
        <p>We do not sell your information, and we do not use it for marketing unless you separately agree to that.</p>

        <h2>4. Legal basis</h2>
        <p>Where the law requires a legal basis (for example in the EU and the UK), we rely on your consent, given when you tick the box on the form, and on our need to carry out the warranty or support service you asked for.</p>

        <h2>5. Who we share it with</h2>
        <ul>
          <li><strong>Service providers</strong> who store, process or send the data for us: our database and website hosting providers, and our email service provider.</li>
          <li><strong>Authorised repair or logistics partners</strong>, only when needed to handle your service request.</li>
          <li><strong>Authorities</strong>, when the law requires it.</li>
        </ul>

        <h2>6. Where your information is stored</h2>
        <p>Your information may be stored and processed outside your country, including in Taiwan and the United States. Where required, we use appropriate safeguards for these transfers.</p>

        <h2>7. How long we keep it</h2>
        <p>We keep your registration and support requests for the warranty period of your product plus 1 year, then delete or anonymise them, unless the law requires us to keep them longer.</p>

        <h2>8. Your rights</h2>
        <p>Depending on where you live, you may have the right to ask us to show you, correct, or delete your information, to withdraw your consent, to object to or restrict how we use it, and to receive a copy of it. To make a request, email <a href={`mailto:${MAIL}`}>{MAIL}</a>. We will reply within 30 days. We may ask you to confirm your identity first.</p>
        <p>Withdrawing consent or asking for deletion may mean we can no longer find your registration when you ask for warranty service.</p>
        <p>You also have the right to complain to the data protection authority in your country.</p>

        <h2>9. Security</h2>
        <p>We limit access to your information to staff who need it for warranty and after-sales work, and we send it over an encrypted connection. No system is completely secure, but we will tell you and the relevant authority if a breach affects you, as the law requires.</p>

        <h2>10. Children</h2>
        <p>These pages are not intended for children under 18. If you believe a child has given us their information, please contact us and we will delete it.</p>

        <h2>11. Changes to this policy</h2>
        <p>If we change this policy, we will update the date at the top of this page.</p>
      </article>
    </main>
  )
}
