from email.message import EmailMessage
from html import escape

from django.conf import settings
from django.utils import timezone


def _safe(value):
    return escape(str(value or ""))


def _details(rows):
    items = "".join(
        f"""
        <tr>
          <td style="padding:10px 12px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;width:38%;">{_safe(label)}</td>
          <td style="padding:10px 12px;color:#172033;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0;">{_safe(value)}</td>
        </tr>
        """
        for label, value in rows
    )
    return f"""
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
           style="border:1px solid #e2e8f0;border-radius:6px;border-collapse:separate;overflow:hidden;margin:22px 0;">
      {items}
    </table>
    """


def _button(label, url):
    return f"""
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
      <tr>
        <td style="background:#176b5b;border-radius:6px;">
          <a href="{_safe(url)}" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">{_safe(label)}</a>
        </td>
      </tr>
    </table>
    """


def _notice(text, tone="neutral"):
    colors = {
        "success": ("#eaf7f2", "#176b5b", "#b8e0d2"),
        "warning": ("#fff8e8", "#8a5a00", "#f0d28a"),
        "danger": ("#fff1f2", "#a51d36", "#fecdd3"),
        "neutral": ("#f1f5f9", "#334155", "#cbd5e1"),
    }
    background, foreground, border = colors[tone]
    return f"""
    <div style="margin:22px 0;padding:14px 16px;background:{background};color:{foreground};border:1px solid {border};border-radius:6px;font-size:13px;line-height:1.6;">
      {_safe(text)}
    </div>
    """


def _layout(
    title,
    preheader,
    content,
    brand="TMS SOVTES",
    footer=None,
    show_team_signature=True,
):
    footer = footer or "Це автоматичне сервісне повідомлення. Не передавайте конфіденційні дані облікового запису третім особам."
    team_signature = ""
    if show_team_signature:
        team_signature = f"""
                <p style="margin:28px 0 0;color:#475569;font-size:14px;line-height:1.7;">
                  З повагою,<br><strong style="color:#172033;">Команда {_safe(brand)}</strong>
                </p>
        """
    return f"""<!doctype html>
<html lang="uk">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>{_safe(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#eef2f5;font-family:Arial,Helvetica,sans-serif;color:#172033;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">{_safe(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f5;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                 style="max-width:600px;background:#ffffff;border:1px solid #dfe5ea;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#172033;padding:20px 28px;border-bottom:4px solid #21a179;">
                <div style="color:#ffffff;font-size:18px;font-weight:700;">{_safe(brand)}</div>
                <div style="color:#aeb9c8;font-size:11px;text-transform:uppercase;margin-top:4px;">Платформа керування транспортом</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 26px;">
                <h1 style="margin:0 0 18px;color:#172033;font-size:24px;line-height:1.25;font-weight:700;">{_safe(title)}</h1>
                {content}
                {team_signature}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:11px;line-height:1.6;">
                {_safe(footer)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def text_message(subject, body, recipient, cc=None, html_body=None):
    message = EmailMessage()
    message["From"] = settings.DEFAULT_FROM_EMAIL
    message["To"] = recipient
    if cc:
        message["Cc"] = cc
    message["Subject"] = subject
    message.set_content(body.strip())
    if html_body:
        message.add_alternative(html_body, subtype="html")
    return message


def registration_admin(client, admin_user):
    subject = f"Нова реєстрація клієнта: {client.name}"
    body = f"""
Новий клієнт зареєструвався та очікує на підтвердження.

Компанія: {client.name}
Ідентифікатор: {client.slug}
Адміністратор: {admin_user.get_full_name()} ({admin_user.email})
Дата реєстрації: {client.created_at}

Перевірте дані та підтвердьте або відхиліть реєстрацію в панелі адміністратора.
"""
    content = f"""
      <p style="margin:0;color:#475569;font-size:15px;line-height:1.7;">Новий клієнт зареєструвався та очікує на перевірку.</p>
      {_details([('Компанія', client.name), ('Ідентифікатор клієнта', client.slug), ('Адміністратор', admin_user.get_full_name()), ('Email', admin_user.email), ('Дата реєстрації', client.created_at)])}
      {_notice('Перевірте надані дані компанії перед підтвердженням доступу.', 'warning')}
    """
    return text_message(
        subject,
        body,
        settings.SYSTEM_ADMIN_EMAIL,
        html_body=_layout(subject, "Нова реєстрація клієнта очікує на перевірку.", content),
    )


def registration_received(client, admin_user):
    subject = "Реєстрацію отримано"
    body = f"""
Вітаємо, {admin_user.get_full_name()}!

Дякуємо за реєстрацію в TMS SOVTES. Заявку компанії {client.name} отримано та передано на перевірку.

Ми надішлемо ще один лист після завершення перевірки.
"""
    content = f"""
      <p style="margin:0 0 14px;color:#475569;font-size:15px;line-height:1.7;">Вітаємо, {_safe(admin_user.get_full_name())}!</p>
      <p style="margin:0;color:#475569;font-size:15px;line-height:1.7;">Дякуємо за реєстрацію компанії <strong style="color:#172033;">{_safe(client.name)}</strong>. Вашу заявку отримано та передано на перевірку.</p>
      {_notice('Ми повідомимо вас електронною поштою одразу після завершення перевірки.', 'neutral')}
    """
    return text_message(
        subject,
        body,
        admin_user.email,
        html_body=_layout(subject, "Ваша реєстрація очікує на перевірку.", content),
    )


def account_approved(client, admin_user):
    subject = "Ваш обліковий запис TMS SOVTES активовано"
    login_url = f"{settings.FRONTEND_URL}/login"
    body = f"""
Вітаємо, {admin_user.get_full_name()}!

Чудова новина! Обліковий запис TMS SOVTES для компанії {client.name} підтверджено та активовано.

Увійти: {login_url}
Ім'я користувача: {admin_user.username}
"""
    content = f"""
      {_notice('Вашу реєстрацію підтверджено. Робочий простір готовий до використання.', 'success')}
      {_details([('Компанія', client.name), ("Ім'я користувача", admin_user.username)])}
      {_button('Відкрити TMS SOVTES', login_url)}
    """
    return text_message(
        subject,
        body,
        admin_user.email,
        html_body=_layout(subject, "Ваш робочий простір готовий до використання.", content),
    )


def account_rejected(client, admin_user, reason):
    subject = "Оновлення щодо реєстрації"
    body = f"""
Вітаємо, {admin_user.get_full_name()}!

Наразі реєстрацію компанії {client.name} у TMS SOVTES не підтверджено.

Причина: {reason}

Для отримання допомоги зверніться за адресою support@sovtes.com.ua.
"""
    content = f"""
      <p style="margin:0;color:#475569;font-size:15px;line-height:1.7;">Вітаємо, {_safe(admin_user.get_full_name())}. Реєстрацію компанії <strong style="color:#172033;">{_safe(client.name)}</strong> не було підтверджено.</p>
      {_notice(f'Причина: {reason}', 'danger')}
      <p style="margin:0;color:#475569;font-size:14px;line-height:1.7;">Маєте запитання? Напишіть нам: <a href="mailto:support@sovtes.com.ua" style="color:#176b5b;font-weight:700;">support@sovtes.com.ua</a>.</p>
    """
    return text_message(
        subject,
        body,
        admin_user.email,
        html_body=_layout(subject, "Є оновлення щодо вашої реєстрації.", content),
    )


def sovtes_welcome(user, temporary_password, client):
    subject = f"Ласкаво просимо до TMS SOVTES - {client.name}"
    login_url = f"{settings.FRONTEND_URL}/login"
    created_at = timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    body = f"""
Вітаємо, {user.get_full_name() or user.first_name}!

Ваш обліковий запис для компанії {client.name} створено.

Ім'я користувача: {user.username}
Email: {user.email}
Тимчасовий пароль: {temporary_password}
Сторінка входу: {login_url}

Цей пароль призначений лише для аварійного доступу. Для звичайного входу використовуйте авторизацію через Sovtes.
Обліковий запис створено: {created_at}
"""
    content = f"""
      <p style="margin:0;color:#475569;font-size:15px;line-height:1.7;">Вітаємо, {_safe(user.get_full_name() or user.first_name)}! Обліковий запис компанії <strong style="color:#172033;">{_safe(client.name)}</strong> готовий.</p>
      {_details([("Ім'я користувача", user.username), ('Email', user.email), ('Тимчасовий пароль', temporary_password)])}
      {_notice('Цей пароль призначений лише для аварійного доступу. Не передавайте його іншим та за можливості використовуйте авторизацію через Sovtes.', 'warning')}
      {_button('Увійти до TMS SOVTES', login_url)}
      <p style="margin:0;color:#94a3b8;font-size:11px;">Обліковий запис створено: {created_at}</p>
    """
    return text_message(
        subject,
        body,
        user.email,
        html_body=_layout(subject, "Ваш обліковий запис TMS SOVTES готовий.", content),
    )


def new_user_welcome(user, plain_password, client, company=None):
    role_display = {
        'logist': 'Логіст',
        'client_admin': 'Адміністратор компанії',
    }.get(user.role.name if user.role else '', user.role.name if user.role else 'Користувач')

    login_url = f"{settings.FRONTEND_URL}/login"
    rows = [
        ("Компанія", client.name),
        ("Роль", role_display),
        ("Email / Логін", user.email),
        ("Пароль", plain_password),
    ]
    if company:
        if company.phone:
            rows.append(("Телефон компанії", company.phone))
        if company.post_address:
            rows.append(("Адреса", company.post_address))
        if company.website:
            rows.append(("Веб-сайт", company.website))

    subject = f"Ваш обліковий запис у TMS SOVTES - {client.name}"
    body = f"""
Вітаємо, {user.get_full_name() or user.username}!

Для вас створено обліковий запис у системі TMS SOVTES.

Компанія: {client.name}
Роль: {role_display}
Email / Логін: {user.email}
Пароль: {plain_password}
Сторінка входу: {login_url}

Рекомендуємо змінити пароль після першого входу.
"""
    content = f"""
      <p style="margin:0 0 14px;color:#475569;font-size:15px;line-height:1.7;">Вітаємо, {_safe(user.get_full_name() or user.username)}!</p>
      <p style="margin:0;color:#475569;font-size:15px;line-height:1.7;">Для вас створено обліковий запис у системі <strong style="color:#172033;">TMS SOVTES</strong>. Нижче наведено ваші дані для входу.</p>
      {_details(rows)}
      {_notice('Рекомендуємо змінити пароль після першого входу до системи.', 'warning')}
      {_button('Увійти до TMS SOVTES', login_url)}
    """
    return text_message(
        subject,
        body,
        user.email,
        html_body=_layout(subject, "Ваш обліковий запис готовий до використання.", content),
    )


def trial_reminder(trial, admin_user, days_before):
    subject = f"Пробний період завершується через {days_before} днів"
    truck_limit = trial.plan.truck_limit if trial.plan.truck_limit != -1 else "Без обмежень"
    end_date = trial.trial_end_date.strftime("%d.%m.%Y")
    body = f"""
Вітаємо, {admin_user.get_full_name()}!

Пробний період TMS SOVTES завершується через {days_before} днів.

Компанія: {trial.client.name}
Тариф: {trial.plan.display_name}
Дата завершення: {end_date}
Ліміт вантажівок: {truck_limit}

Оновіть тариф до завершення пробного періоду, щоб зберегти безперервний доступ.
"""
    content = f"""
      <p style="margin:0;color:#475569;font-size:15px;line-height:1.7;">Вітаємо, {_safe(admin_user.get_full_name())}! Ваш пробний період добігає кінця.</p>
      {_details([('Компанія', trial.client.name), ('Тариф', trial.plan.display_name), ('Дата завершення', end_date), ('Ліміт вантажівок', truck_limit)])}
      {_notice(f'Залишилося {days_before} днів. Оновіть тариф завчасно, щоб уникнути перерви в доступі.', 'warning')}
    """
    return text_message(
        subject,
        body,
        admin_user.email,
        html_body=_layout(subject, "Ваш пробний період незабаром завершиться.", content),
    )


def order_documents(
    customer,
    customer_manager,
    recipient,
    order_number,
    route,
    payment_type,
    price,
    currency,
    invoice_number,
    invoice_date,
    cmr_number,
    post_address,
    sender_company,
    sender_name,
    sender_position,
    sender_phone,
    sender_email,
):
    if payment_type == "by copies":
        subject = f"{customer} - заявка {order_number} - документи для оплати"
        intro = "У вкладенні містяться всі документи, необхідні для оплати."
        body = f"""
Вітаємо, {customer_manager}!

{intro}

Компанія: {sender_company}
Заявка: {order_number}
Маршрут: {route}
Загальна сума: {price} {currency}
Номер інвойсу: {invoice_number}
Дата інвойсу: {invoice_date}
"""
        rows = [
            ("Компанія", sender_company),
            ("Заявка", order_number),
            ("Маршрут", route),
            ("Сума", f"{price} {currency}"),
            ("Інвойс", invoice_number),
            ("Дата інвойсу", invoice_date),
        ]
    elif payment_type == "by originals":
        subject = f"{customer} - заявка {order_number} - оригінали документів"
        intro = "Будь ласка, надішліть інвойс та оригінали транспортних документів за вказаною нижче адресою."
        body = f"""
Вітаємо, {customer_manager}!

{intro}

Компанія: {sender_company}
Інвойс: {invoice_number} від {invoice_date}
Сума: {price} {currency}
CMR: {cmr_number}
Поштова адреса: {post_address}
"""
        rows = [
            ("Компанія", sender_company),
            ("Заявка", order_number),
            ("Інвойс", invoice_number),
            ("Сума", f"{price} {currency}"),
            ("CMR", cmr_number),
            ("Поштова адреса", post_address),
        ]
    else:
        raise ValueError(f"Unsupported payment type: {payment_type}")

    sender_signature = sender_name
    if sender_position:
        sender_signature += f", {sender_position}"
    sender_signature += f"\n{sender_company}"
    if sender_phone:
        sender_signature += f"\n{sender_phone}"
    sender_signature += f"\n{sender_email}"
    body += f"\n\nЗ повагою,\n{sender_signature}"

    content = f"""
      <p style="margin:0 0 14px;color:#475569;font-size:15px;line-height:1.7;">Вітаємо, {_safe(customer_manager)}!</p>
      <p style="margin:0;color:#475569;font-size:15px;line-height:1.7;">{_safe(intro)}</p>
      {_details(rows)}
      {_notice('Відповідні документи додано до цього листа.', 'neutral')}
      <p style="margin:26px 0 0;color:#475569;font-size:13px;line-height:1.7;">
        <strong style="color:#172033;">{_safe(sender_name)}</strong>{f', {_safe(sender_position)}' if sender_position else ''}<br>
        {_safe(sender_company)}<br>
        {f'{_safe(sender_phone)} · ' if sender_phone else ''}<a href="mailto:{_safe(sender_email)}" style="color:#176b5b;">{_safe(sender_email)}</a>
      </p>
    """
    html = _layout(
        subject,
        "Документи за транспортною заявкою додано до листа.",
        content,
        brand=sender_company,
        footer=f"Це повідомлення стосується транспортної заявки, яку супроводжує {sender_company}.",
        show_team_signature=False,
    )
    return text_message(
        subject,
        body,
        recipient,
        cc=settings.ORDER_EMAIL_CC,
        html_body=html,
    )
