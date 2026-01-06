import { Resend } from "resend";
import { ENV } from "./env";

// Initialize Resend client
const getResendClient = () => {
  if (!ENV.resendApiKey) {
    console.warn("[Email] Resend API key not configured");
    return null;
  }
  return new Resend(ENV.resendApiKey);
};

export interface EinladungsEmailParams {
  empfaengerEmail: string;
  empfaengerName?: string;
  unternehmensname: string;
  unternehmensfarbe: string;
  einladenderName: string;
  rolle: string;
  einladungslink: string;
  nachricht?: string;
  gueltigBis: Date;
}

/**
 * Sendet eine Einladungs-E-Mail an einen neuen Benutzer
 */
export async function sendEinladungsEmail(params: EinladungsEmailParams): Promise<boolean> {
  const resend = getResendClient();
  
  if (!resend) {
    console.warn("[Email] Skipping email send - Resend not configured");
    return false;
  }

  const rollenName = {
    admin: "Administrator",
    buchhalter: "Buchhalter",
    viewer: "Nur Lesen",
  }[params.rolle] || params.rolle;

  const gueltigBisFormatiert = params.gueltigBis.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Einladung zu ${params.unternehmensname}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header mit Firmenfarbe -->
          <tr>
            <td style="background-color: ${params.unternehmensfarbe}; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Einladung zu ${params.unternehmensname}
              </h1>
            </td>
          </tr>
          
          <!-- Inhalt -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hallo${params.empfaengerName ? ` ${params.empfaengerName}` : ""},
              </p>
              
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>${params.einladenderName}</strong> hat Sie eingeladen, dem Unternehmen 
                <strong>${params.unternehmensname}</strong> im Buchhaltung Upload Tool beizutreten.
              </p>
              
              ${params.nachricht ? `
              <div style="background-color: #f0f9ff; border-left: 4px solid ${params.unternehmensfarbe}; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #0369a1; font-size: 14px; font-style: italic;">
                  "${params.nachricht}"
                </p>
              </div>
              ` : ""}
              
              <!-- Einladungsdetails -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #f9fafb; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Ihre Rolle:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${rollenName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Gültig bis:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${gueltigBisFormatiert}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${params.einladungslink}" 
                       style="display: inline-block; background-color: ${params.unternehmensfarbe}; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Einladung annehmen
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:
              </p>
              <p style="margin: 8px 0 0; word-break: break-all;">
                <a href="${params.einladungslink}" style="color: ${params.unternehmensfarbe}; font-size: 14px;">
                  ${params.einladungslink}
                </a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Diese E-Mail wurde automatisch vom Buchhaltung Upload Tool versendet.
              </p>
              <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">
                Falls Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const textContent = `
Einladung zu ${params.unternehmensname}

Hallo${params.empfaengerName ? ` ${params.empfaengerName}` : ""},

${params.einladenderName} hat Sie eingeladen, dem Unternehmen ${params.unternehmensname} im Buchhaltung Upload Tool beizutreten.

${params.nachricht ? `Nachricht: "${params.nachricht}"\n` : ""}
Ihre Rolle: ${rollenName}
Gültig bis: ${gueltigBisFormatiert}

Klicken Sie auf den folgenden Link, um die Einladung anzunehmen:
${params.einladungslink}

---
Diese E-Mail wurde automatisch vom Buchhaltung Upload Tool versendet.
Falls Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: "Buchhaltung Upload Tool <noreply@resend.dev>",
      to: params.empfaengerEmail,
      subject: `Einladung zu ${params.unternehmensname}`,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error("[Email] Failed to send invitation email:", error);
      return false;
    }

    console.log(`[Email] Invitation email sent successfully to ${params.empfaengerEmail}, ID: ${data?.id}`);
    return true;
  } catch (error) {
    console.error("[Email] Error sending invitation email:", error);
    return false;
  }
}
