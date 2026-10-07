-- Arabic display copy for job posts, the same convention as the menu items in
-- 20260928120000_arabic_locale: the Arabic store shows these columns and falls
-- back to the English ones when they are empty.

ALTER TABLE "public"."job_posts" ADD COLUMN "title_ar" TEXT NOT NULL DEFAULT '';
ALTER TABLE "public"."job_posts" ADD COLUMN "description_ar" TEXT NOT NULL DEFAULT '';
ALTER TABLE "public"."job_posts" ADD COLUMN "requirements_ar" JSONB NOT NULL DEFAULT '[]';

-- Backfill the posts seeded by scripts/seed-jobs.ts, mirroring how the Arabic
-- menu migration translated its seeded rows. Posts created in admin keep the
-- English fallback until someone adds Arabic in the job form.

UPDATE "public"."job_posts" SET
  "title_ar" = 'عضو فريق المطبخ',
  "description_ar" = 'اعمل على الخط، حضّر المكونات الطازجة، وقدّم الطلبات التي تلبي معايير الجودة لدينا. لا تحتاج إلى خبرة، ندرّبك بشكل كامل.',
  "requirements_ar" = '["موثوق وملتزم بالمواعيد","لاعب فريق","راغب في التعلم"]'::jsonb
WHERE "id" = 'job-harrow-road-kitchen';

UPDATE "public"."job_posts" SET
  "title_ar" = 'مشرف الوردية',
  "description_ar" = 'قد الورديات، وأدِر سير العمل في المطبخ، وتأكد من أن كل عميل يغادر راضياً.',
  "requirements_ar" = '["خبرة سابقة في القيادة","شهادة سلامة الغذاء","جدول مرن"]'::jsonb
WHERE "id" = 'job-tower-hill-shift';

UPDATE "public"."job_posts" SET
  "title_ar" = 'مدير المتجر',
  "description_ar" = 'أدر فرعاً كاملاً لكريسبيز. مسؤولية الأرباح والخسائر، وتطوير الفريق، والعمليات اليومية.',
  "requirements_ar" = '["خبرة إدارية 3 سنوات أو أكثر","خبرة في الأرباح والخسائر","شغف بالطعام"]'::jsonb
WHERE "id" = 'job-kilburn-manager';

UPDATE "public"."job_posts" SET
  "title_ar" = 'سائق توصيل',
  "description_ar" = 'وصّل الطلبات في منطقة إليفانت آند كاسل بالسكوتر. ورديات مرنة، وأجر أسبوعي، وفريق يقف خلفك.',
  "requirements_ar" = '["سكوتر أو دراجة خاصة","رخصة قيادة بريطانية كاملة","هاتف ذكي لاستخدام التطبيق"]'::jsonb
WHERE "id" = 'job-elephant-castle-rider';

UPDATE "public"."job_posts" SET
  "title_ar" = 'فريق الواجهة',
  "description_ar" = 'استقبل الطلبات، وتعامل مع النقد، واجعل كل ضيف يشعر بالترحاب من لحظة دخوله.',
  "requirements_ar" = '["ثقة في التعامل مع النقد","أسلوب ودود","متاح في عطلات نهاية الأسبوع"]'::jsonb
WHERE "id" = 'job-edgware-road-counter';

UPDATE "public"."job_posts" SET
  "title_ar" = 'عضو فريق عطلة نهاية الأسبوع',
  "description_ar" = 'تغطية أيام السبت والأحد على الخط والواجهة. هذا الدور معلّق حالياً حتى استكمال جدول الورديات.',
  "requirements_ar" = '["متاح في يومي نهاية الأسبوع","موثوق وملتزم بالمواعيد"]'::jsonb
WHERE "id" = 'job-stockwell-closed';

UPDATE "public"."job_posts" SET
  "title_ar" = 'مسؤول التسويق للمنطقة',
  "description_ar" = 'مسؤول عن التسويق المحلي لمنطقة هارو، من وسائل التواصل إلى العروض الترويجية داخل الفرع. مسودة قبل جولة التوظيف.',
  "requirements_ar" = '["خبرة في التسويق","معرفة بالسوق المحلي","رخصة قيادة"]'::jsonb
WHERE "id" = 'job-harrow-draft';
