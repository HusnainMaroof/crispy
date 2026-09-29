-- Arabic replaces Urdu as the second storefront language.
ALTER TABLE "cms_section_translations" DROP CONSTRAINT "cms_section_translations_locale_check";
UPDATE "cms_section_translations" SET "locale" = 'ar' WHERE "locale" = 'ur';
ALTER TABLE "cms_section_translations" ADD CONSTRAINT "cms_section_translations_locale_check" CHECK ("locale" IN ('en', 'ar'));

-- Arabic names and descriptions for the menu catalogue.
ALTER TABLE "menu_categories" ADD COLUMN "title_ar" TEXT NOT NULL DEFAULT '';
ALTER TABLE "menu_items" ADD COLUMN "name_ar" TEXT NOT NULL DEFAULT '', ADD COLUMN "description_ar" TEXT NOT NULL DEFAULT '';
ALTER TABLE "deals" ADD COLUMN "name_ar" TEXT NOT NULL DEFAULT '', ADD COLUMN "description_ar" TEXT NOT NULL DEFAULT '';

-- Arabic copy for the seeded catalogue rows (fixed seed IDs only).
UPDATE "menu_categories" SET "title_ar" = 'أجنحة كريسبيز' WHERE "id" = 'cat-wings';
UPDATE "menu_categories" SET "title_ar" = 'أصابع الدجاج' WHERE "id" = 'cat-tenders';
UPDATE "menu_categories" SET "title_ar" = 'برجر بنكهات قوية' WHERE "id" = 'cat-burgers';
UPDATE "menu_categories" SET "title_ar" = 'وجبات الصناديق' WHERE "id" = 'cat-box';
UPDATE "menu_categories" SET "title_ar" = 'برجر جورميه' WHERE "id" = 'cat-gourmet';
UPDATE "menu_categories" SET "title_ar" = 'الراب الكبير' WHERE "id" = 'cat-wrap';
UPDATE "menu_categories" SET "title_ar" = 'شواء كريسبيز الناري' WHERE "id" = 'cat-grill';
UPDATE "menu_categories" SET "title_ar" = 'صحون كريسبيز' WHERE "id" = 'cat-platters';
UPDATE "menu_categories" SET "title_ar" = 'وجبات الأطفال' WHERE "id" = 'cat-kids';
UPDATE "menu_categories" SET "title_ar" = 'الإضافات المميزة' WHERE "id" = 'cat-sides';
UPDATE "menu_categories" SET "title_ar" = 'الحلويات' WHERE "id" = 'cat-desserts';

UPDATE "menu_items" SET "name_ar" = '5 أجنحة', "description_ar" = 'خمسة أجنحة ذهبية مقرمشة مع صلصة البيت من اختيارك.' WHERE "id" = 'item-wings-5';
UPDATE "menu_items" SET "name_ar" = '7 أجنحة', "description_ar" = 'سبعة أجنحة، مقرمشة أكثر ونكهة أقوى — اختر مستوى الحرارة.' WHERE "id" = 'item-wings-7';
UPDATE "menu_items" SET "name_ar" = '10 أجنحة', "description_ar" = 'العشرة كاملة — مثالية للمشاركة أو لوجبتك الكبيرة.' WHERE "id" = 'item-wings-10';
UPDATE "menu_items" SET "name_ar" = 'تريو لذيذ', "description_ar" = 'ثلاث قطع دجاج طرية مغلفة يدوياً، مقرمشة من الخارج وطرية من الداخل.' WHERE "id" = 'item-tenders-3';
UPDATE "menu_items" SET "name_ar" = 'خمس قطع سهلة', "description_ar" = 'خمس قطع ذهبية مقرمشة مع صلصة غمس من اختيارك.' WHERE "id" = 'item-tenders-5';
UPDATE "menu_items" SET "name_ar" = 'عشر خطوات إلى الجنة', "description_ar" = 'عشر قطع — الوجبة الحقيقية. شاركها إن أردت.' WHERE "id" = 'item-tenders-10';
UPDATE "menu_items" SET "name_ar" = 'برجر كريسبيز الكلاسيكي', "description_ar" = 'برجر الدجاج المقرمش الأصلي — كولسلو، مخلل، ومايونيز كريسبيز المميز على خبز بريوش محمص.' WHERE "id" = 'item-burger-classic';
UPDATE "menu_items" SET "name_ar" = 'برجر نباتي', "description_ar" = 'قرص نباتي بكل القرمشة. خس، طماطم، ومايونيز نباتي. بدون تنازلات.' WHERE "id" = 'item-burger-plant';
UPDATE "menu_items" SET "name_ar" = 'برجر المشواة المدخن', "description_ar" = 'صدر دجاج مشوي، شيدر مدخن، بصل مكرمل، وصلصة باربكيو مدخنة.' WHERE "id" = 'item-burger-smoked';
UPDATE "menu_items" SET "name_ar" = 'ربع رطل', "description_ar" = 'قرص سميك متبل مع خس طازج، طماطم، وصلصة خاصة.' WHERE "id" = 'item-burger-quarter';

UPDATE "deals" SET "name_ar" = 'كومبو جناح + إضافة', "description_ar" = '7 أجنحة مقرمشة مع بطاطس محملة وصلصة غمس من اختيارك.' WHERE "id" = 'deal-wing-side';
UPDATE "deals" SET "name_ar" = 'عرض برجر + مشروب', "description_ar" = 'برجر كريسبيز الكلاسيكي مع أي مشروب عادي. الكومبو المثالي للغداء.' WHERE "id" = 'deal-burger-drink';
UPDATE "deals" SET "name_ar" = 'وليمة العائلة', "description_ar" = '10 أجنحة، 5 قطع تندرز، بطاطس محملة، و4 صلصات. تكفي الجميع.' WHERE "id" = 'deal-family';
UPDATE "deals" SET "name_ar" = 'عرض الطالب', "description_ar" = 'قطع تريو لذيذة مع بطاطس ومشروب. أظهر بطاقتك الطلابية.' WHERE "id" = 'deal-student';

-- Published Arabic copies for the CMS sections, starting from the English content.
INSERT INTO "cms_section_translations" ("id", "section_id", "locale", "content", "is_published", "created_at", "updated_at")
SELECT gen_random_uuid()::text, en."section_id", 'ar',
  CASE s."key"
    WHEN 'hero' THEN en."content" || '{"lines":["دائماً لذيذ","طعام يبهج"]}'::jsonb
    WHEN 'welcome' THEN en."content" || '{"headline":"مرحباً بكم في","accent":"كريسبيز","description":"تأسست كريسبيز بهدف تقديم أفضل برجر ودجاج مقرمش على الإطلاق. هدفنا دائماً تقديم طعام طازج ومصنوع يدوياً مليء بالنكهات من حول العالم."}'::jsonb
    WHEN 'locations' THEN en."content" || '{"title":"اعثر على أقرب فرع لكريسبيز","ctaLabel":"عرض كل الفروع"}'::jsonb
    WHEN 'instagram' THEN en."content" || '{"bio":"طعام يبهج المزاج 🍔🍟","followLabel":"متابعة"}'::jsonb
    WHEN 'partner' THEN en."content" || '{"title":"أحضر كريسبيز\nإلى مدينتك.","description":"انضم إلى أسرع ماركة مطاعم حلال نمواً في لندن.","ctaLabel":"كن شريكاً"}'::jsonb
    WHEN 'navigation' THEN en."content" || '{"links":[{"label":"القائمة","href":"/menu"},{"label":"الفروع","href":"/locations"},{"label":"استفسار الامتياز","href":"/franchise-inquiries"}],"menuLabel":"القائمة","closeLabel":"إغلاق"}'::jsonb
    WHEN 'logo' THEN en."content" || '{"alt":"الصفحة الرئيسية لكريسبيز"}'::jsonb
    WHEN 'ordering' THEN en."content" || '{"ctaLabel":"اطلب الآن"}'::jsonb
    ELSE en."content"
  END,
  true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "cms_section_translations" en
JOIN "cms_sections" s ON s."id" = en."section_id"
WHERE en."locale" = 'en'
ON CONFLICT ("section_id", "locale") DO NOTHING;
