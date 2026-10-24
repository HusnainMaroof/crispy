-- Show or hide the branch phone number on the store location card.
ALTER TABLE "locations" ADD COLUMN "show_phone" BOOLEAN NOT NULL DEFAULT true;
