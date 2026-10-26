import type { FormEvent } from 'react';
import { openWhatsApp } from '../hooks';

const GARMENTS = ['Premium crocodile polos', '220 GSM tees', '240 GSM tees', 'Performance blends', 'Other / custom brief'];

interface Props {
  phone: string;
  displayPhone: string;
}

export function Contact({ phone, displayPhone }: Props) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const v = (key: string) => String(form.get(key) ?? '').trim();
    const text = `Hello ALFA, I'd like a quotation.\n\nName: ${v('name')}\nPhone: ${v('phone')}\nGarment: ${v('garment')}\nQuantity: ${v('quantity') || 'Please advise'}\nNotes: ${v('details') || 'None'}`;
    openWhatsApp(phone, text);
  };

  return (
    <section className="contact" id="contact">
      <div className="contain contactgrid">
        <div>
          <span className="caps g">LET'S BUILD YOUR ORDER</span>
          <h2 className="display">MAKE IT<br /><span className="g">ALFA.</span></h2>
          <p>Whether you're ordering for yourself or for an entire team, share the details and we'll continue the conversation directly on WhatsApp.</p>
          <div style={{ fontSize: 13, fontWeight: 750, marginTop: 32 }}>WHATSAPP · {displayPhone}</div>
        </div>
        <form className="formgrid" id="quoteform" onSubmit={submit}>
          <div className="field"><label htmlFor="qname">Your name / company</label><input required id="qname" name="name" autoComplete="name" placeholder="Your name" /></div>
          <div className="field"><label htmlFor="qphone">Phone / WhatsApp</label><input required id="qphone" name="phone" type="tel" autoComplete="tel" placeholder="07X XXX XXXX" /></div>
          <div className="field">
            <label htmlFor="qtype">Garment type</label>
            <select required id="qtype" name="garment" defaultValue="">
              <option value="" disabled>Select garment</option>
              {GARMENTS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="qquantity">Estimated quantity</label><input id="qquantity" name="quantity" type="number" min="1" placeholder="e.g. 50" /></div>
          <div className="field wide"><label htmlFor="qdetails">Your requirements</label><textarea id="qdetails" name="details" placeholder="Print method, colours, size mix, deadline..."></textarea></div>
          <button className="mainbtn" type="submit">Continue on WhatsApp ↗</button>
        </form>
      </div>
    </section>
  );
}
