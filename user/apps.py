import logging
import os

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class UserConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "user"

    def ready(self):
        import user.signals  # noqa: F401

        from django.conf import settings

        media_root = getattr(settings, "MEDIA_ROOT", None)
        if media_root:
            images_dir = os.path.join(str(media_root), "images")
            try:
                os.makedirs(images_dir, exist_ok=True)
            except OSError as e:
                logger.warning(
                    "Could not create %s — image uploads will fail until "
                    "this directory exists with correct permissions. Error: %s",
                    images_dir,
                    e,
                )
