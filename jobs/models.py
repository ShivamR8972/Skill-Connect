from django.db import models
from django.conf import settings
from profiles.models import Skill
import uuid, os

User = settings.AUTH_USER_MODEL

def picture_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    new_filename = f"{uuid.uuid4()}{ext}"
    return os.path.join('job_pictures', new_filename)

class Job(models.Model):
    recruiter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="jobs"
    )
    title = models.CharField(max_length=255)
    pay_per_hour = models.DecimalField(max_digits=10, decimal_places=2)
    skills = models.ManyToManyField(Skill, related_name='jobs', blank=True)
    requirements = models.TextField(blank=False, null=False)
    work_mode = models.CharField(max_length=20, choices=[("remote","Remote"),("hybrid","Hybrid"),("inoffice","In-Office")], default="applied")
    location = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    picture = models.ImageField(upload_to=picture_upload_path, blank=True, null=True)
    key_responsibilities = models.TextField(blank=False, null=False)

    def __str__(self):
        return f"{self.title} ({self.recruiter.email})"

class Application(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="applications")
    freelancer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="applications"
    )
    cover_letter = models.TextField(blank=True)
    resume = models.FileField(upload_to="applications/resumes/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=[("applied", "Applied"), ("reviewed", "Reviewed"), ("accepted", "Accepted"), ("rejected", "Rejected")],
        default="applied"
    )

    class Meta:
        unique_together = ("job", "freelancer")  # freelancer can apply only once

    def __str__(self):
        return f"{self.freelancer.email} → {self.job.title}"
