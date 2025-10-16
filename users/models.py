from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Roles(models.TextChoices):
        RECRUITER = "recruiter", "Recruiter"
        FREELANCER = "freelancer", "Freelancer"

    # make email the unique login field
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Roles.choices)

    # Use email as username field
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return f"{self.email} ({self.role})"
