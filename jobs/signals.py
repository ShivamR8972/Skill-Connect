from django.core.mail import EmailMultiAlternatives
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Application
from profiles.models import Notification

@receiver(post_save, sender=Application)
def send_status_update_email(sender, instance, created, **kwargs):
    if created:
        return

    freelancer = instance.freelancer

    Notification.objects.create(
        user=freelancer,
        message=f"Your application for '{instance.job.title}' is now {instance.get_status_display()}."
    )

    subject = f"Update on your application for {instance.job.title}"


    text_message = (
        f"Hello {getattr(freelancer.freelancer_profile, 'name', freelancer.email)},\n\n"
        f"Your application for the job '{instance.job.title}' has been updated.\n"
        f"New status: {instance.get_status_display()}.\n\n"
        f"Thank you for using Skill Connect!"
    )


    html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:20px;">
            <div style="max-width:600px; margin:auto; background:#ffffff; padding:20px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
                <h2 style="color:#2e86de; text-align:center;">Application Update</h2>
                <p>Hi <b>{getattr(freelancer.freelancer_profile, 'name', freelancer.email)}</b>,</p>
                <p>Your application for the role of <b>{instance.job.title}</b> has been updated.</p>
                <p><b>New status:</b> {instance.get_status_display()}</p>
                <br>
                <p style="font-size:14px; color:#555;">Thank you for using <b>Skill Connect</b>!</p>
                <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
                <p style="font-size:12px; color:#777; text-align:center;">
                    This is an automated status update email. Please do not reply.
                </p>
            </div>
        </body>
        </html>
    """

    email = EmailMultiAlternatives(
        subject,
        text_message,
        None,
        [freelancer.email],
    )
    email.attach_alternative(html_message, "text/html")
    email.send(fail_silently=True)
