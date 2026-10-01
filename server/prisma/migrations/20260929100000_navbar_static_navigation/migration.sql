-- Navigation links and social icons are fixed in the storefront code and are no
-- longer CMS-managed. Drop the leftover navbar section rows so they cannot be
-- served or reactivated. Translations cascade with the section.
DELETE FROM "cms_sections"
WHERE "page" = 'navbar'
  AND "key" IN ('navigation', 'actions', 'socials');
