CREATE TABLE "track_collaborators" (
	"id" varchar PRIMARY KEY NOT NULL,
	"track_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "track_collaborators" ADD CONSTRAINT "track_collaborators_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_collaborators" ADD CONSTRAINT "track_collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "track_collaborator_idx" ON "track_collaborators" USING btree ("track_id","user_id");