#!/bin/bash
export DATABASE_URL="postgresql://neondb_owner:npg_QHI4Caq2GDht@ep-square-rain-ag6s98sl-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
cd /home/will/dev-project/portfolio
npx tsx prisma/seed.ts
