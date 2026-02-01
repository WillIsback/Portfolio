-- CreateTable
CREATE TABLE "Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imagePath" TEXT,
    "github" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProjectLanguage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    CONSTRAINT "ProjectLanguage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectDatabase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "database" TEXT NOT NULL,
    CONSTRAINT "ProjectDatabase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectBackend" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "backend" TEXT NOT NULL,
    CONSTRAINT "ProjectBackend_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectFrontend" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "frontend" TEXT NOT NULL,
    CONSTRAINT "ProjectFrontend_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectDevOps" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "devops" TEXT NOT NULL,
    CONSTRAINT "ProjectDevOps_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectLanguage_projectId_language_key" ON "ProjectLanguage"("projectId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectDatabase_projectId_database_key" ON "ProjectDatabase"("projectId", "database");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectBackend_projectId_backend_key" ON "ProjectBackend"("projectId", "backend");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectFrontend_projectId_frontend_key" ON "ProjectFrontend"("projectId", "frontend");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectDevOps_projectId_devops_key" ON "ProjectDevOps"("projectId", "devops");
