.PHONY: build deploy clean build-admin build-teacher deploy-admin deploy-teacher

# Default: build both and deploy
all: build deploy

# ── Build ──────────────────────────────────────────────────
build: build-admin build-teacher

build-admin:
	@echo "Building admin dashboard..."
	cd edulink-admin && rm -rf .next out && npm run build

build-teacher:
	@echo "Building teacher dashboard..."
	cd edulink-teacher && rm -rf .next out && npm run build

# ── Deploy ─────────────────────────────────────────────────
deploy: build
	@echo "Deploying to Firebase Hosting..."
	firebase deploy --only hosting

deploy-admin:
	@echo "Deploying admin only..."
	firebase deploy --only hosting:admin

deploy-teacher:
	@echo "Deploying teacher only..."
	firebase deploy --only hosting:teacher

# ── Clean ──────────────────────────────────────────────────
clean:
	rm -rf edulink-admin/.next edulink-admin/out
	rm -rf edulink-teacher/.next edulink-teacher/out

# ── Quick deploy (skip build if already built) ─────────────
ship:
	firebase deploy --only hosting

# ── Dev ────────────────────────────────────────────────────
dev-admin:
	cd edulink-admin && npm run dev

dev-teacher:
	cd edulink-teacher && npm run dev

dev-backend:
	cd edulink-backend && npm start

# ── Help ───────────────────────────────────────────────────
help:
	@echo "make build          — Build both dashboards"
	@echo "make deploy         — Build + deploy both"
	@echo "make deploy-admin   — Deploy admin only"
	@echo "make deploy-teacher — Deploy teacher only"
	@echo "make ship           — Deploy without rebuilding"
	@echo "make clean          — Remove build artifacts"
	@echo "make dev-admin      — Run admin dev server"
	@echo "make dev-teacher    — Run teacher dev server"
	@echo "make dev-backend    — Run backend"
