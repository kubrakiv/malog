import React from "react";
import "./style.scss";

const ContactsComponent = () => {
  return (
    <section id="section6" className="">
      <div className="contacts-bg">
        <div className="contacts-page">
          <div className="contacts-left">
            <h2>Contacts</h2>
            <div className="contacts">
              {/* <p>Телефон: +380 44 123 45 67</p> */}
              <div>Email: info@deltalogistics.cz</div>
            </div>
          </div>
          <div className="contacts-center">
            <h2>Address:</h2>
            <div>Delta Logistics S.R.O.</div>
            <div>Kodymova 2536/14 Stodůlky</div>
            <div>158 00 Praha 5, Czech Republic</div>
            <div>VAT: CZ24295540</div>
          </div>
          <div className="contacts-right">
            <iframe
              className="map"
              title="map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2561.812636596003!2d14.33486347653385!3d50.05234107151886!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x470b95f1cc7d08a7%3A0xce416723e376840!2zS29keW1vdmEgMjUzNi8xNCwgMTU4IDAwIFByYWhhIDEzLVN0b2TFr2xreSwg0KfQtdGF0ZbRjw!5e0!3m2!1suk!2sua!4v1724703103647!5m2!1suk!2sua"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactsComponent;
