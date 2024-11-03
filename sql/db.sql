
DROP TABLE IF EXISTS "communities";
CREATE TABLE "public"."communities" (
    "id" bigint NOT NULL,
    "owner" bigint NOT NULL,
    "name" text NOT NULL,
    "description" text,
    CONSTRAINT "communities_id" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "post_votes";
CREATE TABLE "public"."post_votes" (
    "post_id" bigint NOT NULL,
    "voter" bigint NOT NULL,
    "vote_type" integer NOT NULL
) WITH (oids = false);

DROP TABLE IF EXISTS "posts";
CREATE TABLE "public"."posts" (
    "id" bigint NOT NULL,
    "author" bigint NOT NULL,
    "community" bigint NOT NULL,
    "content" text NOT NULL,
    "title" text NOT NULL,
    CONSTRAINT "posts_id" PRIMARY KEY ("id")
) WITH (oids = false);

DROP TABLE IF EXISTS "user_subscriptions";
CREATE TABLE "public"."user_subscriptions" (
    "subscriber" bigint NOT NULL,
    "community" bigint NOT NULL
) WITH (oids = false);

DROP TABLE IF EXISTS "users";
CREATE TABLE "public"."users" (
    "id" bigint NOT NULL,
    "username" text NOT NULL,
    "email" text NOT NULL,
    "password_hash" text NOT NULL,
    "site_banned" boolean DEFAULT false NOT NULL,
    CONSTRAINT "users_id" PRIMARY KEY ("id")
) WITH (oids = false);

ALTER TABLE ONLY "public"."communities" ADD CONSTRAINT "communities_owner_fkey" FOREIGN KEY (owner) REFERENCES users(id) NOT DEFERRABLE;

ALTER TABLE ONLY "public"."post_votes" ADD CONSTRAINT "post_votes_post_id_fkey" FOREIGN KEY (post_id) REFERENCES posts(id) NOT DEFERRABLE;
ALTER TABLE ONLY "public"."post_votes" ADD CONSTRAINT "post_votes_voter_fkey" FOREIGN KEY (voter) REFERENCES users(id) NOT DEFERRABLE;

ALTER TABLE ONLY "public"."posts" ADD CONSTRAINT "posts_author_fkey" FOREIGN KEY (author) REFERENCES users(id) NOT DEFERRABLE;
ALTER TABLE ONLY "public"."posts" ADD CONSTRAINT "posts_community_fkey" FOREIGN KEY (community) REFERENCES communities(id) NOT DEFERRABLE;

ALTER TABLE ONLY "public"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_community_fkey" FOREIGN KEY (community) REFERENCES communities(id) NOT DEFERRABLE;
ALTER TABLE ONLY "public"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_subscriber_fkey" FOREIGN KEY (subscriber) REFERENCES users(id) NOT DEFERRABLE;
