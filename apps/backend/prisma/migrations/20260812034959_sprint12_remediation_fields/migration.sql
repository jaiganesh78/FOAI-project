-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'LOCKED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AuthProviderType" AS ENUM ('LOCAL', 'GOOGLE', 'MICROSOFT', 'AADHAAR', 'WEBAUTHN');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('CREATED', 'IN_PROGRESS', 'PARTIALLY_COMPLETED', 'COMPLETED', 'VERIFIED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FactCategory" AS ENUM ('PERSONAL', 'DEMOGRAPHICS', 'FAMILY', 'EDUCATION', 'OCCUPATION', 'FINANCIAL', 'ADDRESS', 'AGRICULTURE', 'DISABILITY', 'COMMUNITY', 'RELIGION', 'GOVERNMENT_IDENTIFIER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AttributeDataType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'ENUM', 'JSON');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'SELF_DECLARED', 'SYSTEM_VERIFIED', 'DOCUMENT_VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CreationMethod" AS ENUM ('USER_FORM', 'OCR', 'ADMIN', 'DIGILOCKER', 'API', 'IMPORT', 'AI_EXTRACTION');

-- CreateEnum
CREATE TYPE "ConfidenceSource" AS ENUM ('USER', 'DOCUMENT', 'AI', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "OnboardingSessionStatus" AS ENUM ('STARTED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "QuestionInputType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'RADIO', 'CHECKBOX', 'MULTI_SELECT', 'TEXTAREA');

-- CreateEnum
CREATE TYPE "AnswerStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VALIDATED');

-- CreateEnum
CREATE TYPE "PolicyLifecycleStatus" AS ENUM ('DISCOVERED', 'DOWNLOADED', 'PROCESSED', 'NORMALIZED', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('PORTAL', 'GAZETTE', 'API', 'BUDGET', 'SCHOLARSHIP', 'GAZETTE_PDF');

-- CreateEnum
CREATE TYPE "CrawlStrategy" AS ENUM ('REALTIME_POLL', 'CRON_SCHEDULE', 'WEB_SCRAPE', 'MANUAL_UPLOAD', 'API_PULL');

-- CreateEnum
CREATE TYPE "PolicyRelationshipType" AS ENUM ('SUPERSEDES', 'DEPENDS_ON', 'EXTENDS', 'RELATED_SCHEME', 'REQUIRED_DOCUMENT', 'PARENT_POLICY', 'CHILD_POLICY');

-- CreateEnum
CREATE TYPE "DocumentClassification" AS ENUM ('SCHEME', 'GOVERNMENT_ORDER', 'GAZETTE', 'CIRCULAR', 'NOTIFICATION', 'AMENDMENT', 'GUIDELINE', 'FAQ', 'BUDGET', 'PRESS_RELEASE');

-- CreateEnum
CREATE TYPE "EmbeddingStatus" AS ENUM ('PENDING', 'GENERATED', 'FAILED');

-- CreateEnum
CREATE TYPE "EligibilityStatus" AS ENUM ('ELIGIBLE', 'INELIGIBLE', 'POTENTIALLY_ELIGIBLE', 'REQUIRES_MORE_DATA', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RuleOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'GREATER_OR_EQUAL', 'LESS_OR_EQUAL', 'BETWEEN', 'IN', 'NOT_IN', 'EXISTS', 'NOT_EXISTS', 'REGEX', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "LogicalGroupOperator" AS ENUM ('ALL', 'ANY', 'NONE', 'X_OF_Y');

-- CreateEnum
CREATE TYPE "RuleEvaluationCost" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RuleDependencyType" AS ENUM ('DEPENDS_ON', 'BLOCKS', 'REQUIRES', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "OpportunityGapType" AS ENUM ('INCOME_THRESHOLD_EXCEEDED', 'AGE_THRESHOLD_NOT_MET', 'MISSING_IDENTIFIER', 'MISSING_EVIDENCE', 'LOCATION_MISMATCH');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RecommendationPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "RecommendationLifecycleStatus" AS ENUM ('GENERATED', 'RECOMMENDED', 'VIEWED', 'SAVED', 'IN_PROGRESS', 'APPLIED', 'APPROVED', 'REJECTED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApplicationReadinessStatus" AS ENUM ('READY', 'PARTIALLY_READY', 'MISSING_DOCUMENTS', 'NOT_READY');

-- CreateEnum
CREATE TYPE "RecommendationChangeType" AS ENUM ('ADDED', 'REMOVED', 'MOVED', 'UPDATED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RecommendationFeedbackAction" AS ENUM ('VIEWED', 'IGNORED', 'SAVED', 'DISMISSED', 'APPLIED', 'COMPLETED', 'EXPIRED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ApplicationJourneyStatus" AS ENUM ('CREATED', 'PLANNED', 'READY', 'IN_PROGRESS', 'WAITING_FOR_DOCUMENTS', 'WAITING_FOR_VERIFICATION', 'READY_TO_SUBMIT', 'SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'APPROVED', 'REJECTED', 'BENEFIT_RECEIVED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "JourneyStepStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'READY', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ChecklistStatus" AS ENUM ('PENDING', 'PARTIALLY_MET', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DocumentRequirementStatus" AS ENUM ('REQUIRED', 'PROVIDED', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "JourneyUrgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('RECOMMENDATION_GENERATED', 'JOURNEY_CREATED', 'CHECKLIST_GENERATED', 'DOCUMENT_ADDED', 'VERIFICATION_COMPLETE', 'APPLICATION_SUBMITTED', 'STATUS_UPDATED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JourneyDependencyType" AS ENUM ('REQUIRES', 'BLOCKS', 'OPTIONAL', 'PARALLEL');

-- CreateEnum
CREATE TYPE "JourneyProgressType" AS ENUM ('OVERALL', 'CATEGORY', 'STEP', 'DEPENDENCY', 'DOCUMENT', 'VERIFICATION');

-- CreateEnum
CREATE TYPE "StepExecutionMode" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "StepOwner" AS ENUM ('CITIZEN', 'GOVERNMENT_OFFICER', 'EXTERNAL_AGENCY');

-- CreateEnum
CREATE TYPE "StepBlockingBehavior" AS ENUM ('BLOCKING', 'NON_BLOCKING', 'WARNING_ONLY');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'STORED', 'CLASSIFIED', 'QUALITY_CHECKED', 'OCR_PROCESSED', 'FACTS_EXTRACTED', 'VERIFICATION_PENDING', 'VERIFIED', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('IDENTITY_PROOF', 'INCOME_CERTIFICATE', 'LAND_RECORD', 'CASTE_CERTIFICATE', 'BANK_PASSBOOK', 'RESIDENCE_PROOF', 'DISABILITY_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentQualityGrade" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'UNUSABLE');

-- CreateEnum
CREATE TYPE "OCRReadiness" AS ENUM ('READY', 'NEEDS_PREPROCESSING', 'UNUSABLE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'EXPIRED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "DocumentVerificationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED', 'EXPIRED', 'REQUIRES_MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "ConflictStatus" AS ENUM ('DETECTED', 'UNDER_REVIEW', 'RESOLVED', 'IGNORED');

-- CreateEnum
CREATE TYPE "DocumentConfidenceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('CITIZEN_UPLOAD', 'GOVERNMENT_API', 'DIGILOCKER', 'MANUAL_OFFICER', 'OCR_AUTOMATED');

-- CreateEnum
CREATE TYPE "DocumentSource" AS ENUM ('CITIZEN_UPLOAD', 'DIGILOCKER', 'GOVERNMENT_PORTAL', 'OFFICER_UPLOAD');

-- CreateEnum
CREATE TYPE "OCRStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ConflictResolutionType" AS ENUM ('ACCEPT_DOCUMENT', 'ACCEPT_CITIZEN_DECLARATION', 'MANUAL_OVERRIDE', 'SUPERSEDE');

-- CreateTable
CREATE TABLE "system_health_checks" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "accountLockedUntil" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_identities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProviderType" NOT NULL DEFAULT 'LOCAL',
    "providerUserId" TEXT NOT NULL,
    "passwordHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "refresh_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceName" TEXT,
    "platform" TEXT,
    "browser" TEXT,
    "operatingSystem" TEXT,
    "approximateLocation" TEXT,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replacedByTokenId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_histories" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizen_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ProfileStatus" NOT NULL DEFAULT 'CREATED',
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizen_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizen_attribute_registry" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "category" "FactCategory" NOT NULL,
    "dataType" "AttributeDataType" NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "isSearchable" BOOLEAN NOT NULL DEFAULT true,
    "isFilterable" BOOLEAN NOT NULL DEFAULT true,
    "isAiSearchable" BOOLEAN NOT NULL DEFAULT true,
    "isCopilotVisible" BOOLEAN NOT NULL DEFAULT true,
    "isEligibilityRelevant" BOOLEAN NOT NULL DEFAULT true,
    "isSensitiveData" BOOLEAN NOT NULL DEFAULT false,
    "piiClassification" TEXT NOT NULL DEFAULT 'LOW',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "uiGroup" TEXT NOT NULL DEFAULT 'GENERAL',
    "parentKey" TEXT,
    "activationCondition" TEXT,
    "dependencyRules" JSONB,
    "validationRules" JSONB,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizen_attribute_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizen_facts" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "valueText" TEXT,
    "valueNumber" DOUBLE PRECISION,
    "valueBoolean" BOOLEAN,
    "valueDate" TIMESTAMP(3),
    "valueJson" JSONB,
    "normalizedValue" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "confidenceSource" "ConfidenceSource" NOT NULL DEFAULT 'USER',
    "confidenceStrategy" TEXT NOT NULL DEFAULT 'DETERMINISTIC',
    "verificationLevel" TEXT NOT NULL DEFAULT 'SELF_DECLARED',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'SELF_DECLARED',
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourcePrecedence" INTEGER NOT NULL DEFAULT 5,
    "freshnessStatus" TEXT NOT NULL DEFAULT 'FRESH',
    "freshnessExpiryDate" TIMESTAMP(3),
    "freshnessPolicyVersion" INTEGER NOT NULL DEFAULT 1,
    "creationMethod" "CreationMethod" NOT NULL DEFAULT 'USER_FORM',
    "createdBy" TEXT NOT NULL,
    "evidenceId" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizen_facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizen_fact_history" (
    "id" TEXT NOT NULL,
    "factId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeReason" TEXT,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citizen_fact_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizen_profile_versions" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citizen_profile_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_evidence" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "issuingAuthority" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "storageRef" TEXT,
    "checksum" TEXT,
    "metadata" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fact_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_blueprints" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetPersona" TEXT NOT NULL DEFAULT 'ALL',
    "categories" JSONB NOT NULL,
    "stepOrdering" JSONB NOT NULL,
    "completionRules" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredAt" TIMESTAMP(3),
    "previousBlueprintId" TEXT,
    "nextBlueprintId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_catalog" (
    "id" TEXT NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "questionCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "helpText" TEXT,
    "placeholder" TEXT,
    "inputType" "QuestionInputType" NOT NULL DEFAULT 'TEXT',
    "options" JSONB,
    "renderingMetadata" JSONB,
    "displayGroup" TEXT NOT NULL DEFAULT 'GENERAL',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "variant" TEXT NOT NULL DEFAULT 'DEFAULT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "blueprintVersion" INTEGER NOT NULL DEFAULT 1,
    "currentStep" TEXT NOT NULL,
    "completedSteps" JSONB NOT NULL,
    "skippedSteps" JSONB NOT NULL,
    "draftAnswers" JSONB,
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" "OnboardingSessionStatus" NOT NULL DEFAULT 'STARTED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT NOT NULL,
    "previousState" JSONB,
    "changeReason" TEXT,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_session_timelines" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "stepKey" TEXT,
    "questionKey" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_session_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_analytics" (
    "id" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "averageTimePerQuestionSec" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "firstPassCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "revisitCount" INTEGER NOT NULL DEFAULT 0,
    "dependencyTriggerFrequency" INTEGER NOT NULL DEFAULT 0,
    "validationRetryRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "abandonedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_sources" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" "KnowledgeSourceType" NOT NULL DEFAULT 'PORTAL',
    "baseUrl" TEXT NOT NULL,
    "crawlStrategy" "CrawlStrategy" NOT NULL DEFAULT 'CRON_SCHEDULE',
    "updateFrequencyCron" TEXT NOT NULL DEFAULT '0 0 * * *',
    "capabilities" JSONB NOT NULL,
    "healthStatus" TEXT NOT NULL DEFAULT 'HEALTHY',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_source_schedules" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "cronExpression" TEXT NOT NULL,
    "adaptiveIntervalMin" INTEGER NOT NULL DEFAULT 60,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_source_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_documents" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "classification" "DocumentClassification" NOT NULL DEFAULT 'SCHEME',
    "status" "PolicyLifecycleStatus" NOT NULL DEFAULT 'DISCOVERED',
    "currentVersionNumber" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_versions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "fingerprintHash" TEXT NOT NULL,
    "rawContentUrl" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "supersededByVersionId" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_relationships" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "targetDocumentId" TEXT NOT NULL,
    "relationshipType" "PolicyRelationshipType" NOT NULL,

    CONSTRAINT "policy_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_chunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "stableChunkId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "sectionTitle" TEXT,
    "pageNumber" INTEGER,
    "paragraphIndex" INTEGER,
    "content" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_chunk_metadata" (
    "id" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "ministry" TEXT,
    "department" TEXT,
    "schemeName" TEXT,
    "state" TEXT,
    "district" TEXT,
    "beneficiaryCategory" TEXT,
    "normalizedAmount" DOUBLE PRECISION,
    "extractionConfidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "extractionMethod" TEXT NOT NULL DEFAULT 'DETERMINISTIC',
    "extractedBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "extractionTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceLocation" TEXT,

    CONSTRAINT "policy_chunk_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_fingerprints" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "fingerprintHash" TEXT NOT NULL,
    "documentSize" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "publicationDate" TIMESTAMP(3),
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_fingerprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_quality_reports" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "completenessScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "parsingSuccess" BOOLEAN NOT NULL DEFAULT true,
    "metadataConfidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "duplicateConfidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "chunkCoverage" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "normalizationSuccess" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_quality_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embedding_preparations" (
    "id" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "status" "EmbeddingStatus" NOT NULL DEFAULT 'PENDING',
    "embeddingVersion" TEXT NOT NULL DEFAULT 'v1',
    "modelIdentifier" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "checksum" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "embedding_preparations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_ingestion_jobs" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "stage" TEXT NOT NULL DEFAULT 'DISCOVERY',
    "processingDurationMs" INTEGER NOT NULL DEFAULT 0,
    "parsingDurationMs" INTEGER NOT NULL DEFAULT 0,
    "normalizationDurationMs" INTEGER NOT NULL DEFAULT 0,
    "chunkGenerationDurationMs" INTEGER NOT NULL DEFAULT 0,
    "storageDurationMs" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "knowledge_ingestion_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_rules" (
    "id" TEXT NOT NULL,
    "policyVersionId" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "estimatedCost" "RuleEvaluationCost" NOT NULL DEFAULT 'LOW',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_rule_versions" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "logicFingerprint" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_rule_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_groups" (
    "id" TEXT NOT NULL,
    "ruleVersionId" TEXT NOT NULL,
    "parentGroupId" TEXT,
    "logicalOperator" "LogicalGroupOperator" NOT NULL DEFAULT 'ALL',
    "thresholdX" INTEGER,

    CONSTRAINT "rule_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_conditions" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "operator" "RuleOperator" NOT NULL,
    "expectedValue" JSONB NOT NULL,
    "description" TEXT,
    "estimatedCost" "RuleEvaluationCost" NOT NULL DEFAULT 'LOW',

    CONSTRAINT "rule_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "explainability_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "templateText" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-IN',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "explainability_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_dependencies" (
    "id" TEXT NOT NULL,
    "sourceRuleId" TEXT NOT NULL,
    "targetRuleId" TEXT NOT NULL,
    "dependencyType" "RuleDependencyType" NOT NULL DEFAULT 'DEPENDS_ON',

    CONSTRAINT "rule_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_usage_indexes" (
    "id" TEXT NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "conditionId" TEXT NOT NULL,
    "ruleVersionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_usage_indexes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_traces" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "citizenSnapshotId" TEXT NOT NULL,
    "policyVersionId" TEXT NOT NULL,
    "policyRuleVersionId" TEXT NOT NULL,
    "status" "EligibilityStatus" NOT NULL,
    "executionDurationMs" INTEGER NOT NULL,
    "traceVersion" TEXT NOT NULL DEFAULT 'v1',
    "engineVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "correlationId" TEXT NOT NULL,
    "evaluatedRulesCount" INTEGER NOT NULL,
    "passedRulesCount" INTEGER NOT NULL,
    "failedRulesCount" INTEGER NOT NULL,
    "skippedRulesCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_traces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_trace_nodes" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "decision_trace_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_trace_edges" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,

    CONSTRAINT "decision_trace_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eligibility_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "citizenSnapshotId" TEXT NOT NULL,
    "policyVersionId" TEXT NOT NULL,
    "decisionTraceId" TEXT NOT NULL,
    "status" "EligibilityStatus" NOT NULL,
    "resultSummary" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eligibility_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eligibility_results" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyVersionId" TEXT NOT NULL,
    "status" "EligibilityStatus" NOT NULL,
    "passedRules" JSONB NOT NULL,
    "failedRules" JSONB NOT NULL,
    "skippedRules" JSONB NOT NULL,
    "humanExplanation" TEXT NOT NULL,
    "technicalExplanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eligibility_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_analyses" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "gapType" "OpportunityGapType" NOT NULL,
    "description" TEXT NOT NULL,
    "requiredAction" TEXT NOT NULL,
    "potentialBenefitAmount" DOUBLE PRECISION,
    "gapValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefit_analyses" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "totalMonetaryValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "recurringMonthlyValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "oneTimeGrantValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "urgencyLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "applicationDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "benefit_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_metrics_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "executionDurationMs" INTEGER NOT NULL,
    "graphDepth" INTEGER NOT NULL,
    "executedRuleCount" INTEGER NOT NULL,
    "skippedRuleCount" INTEGER NOT NULL,
    "dependencyTraversalCount" INTEGER NOT NULL,
    "cacheHit" BOOLEAN NOT NULL,
    "replayExecutionTimeMs" INTEGER,
    "incrementalEvaluationSavingsMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_metrics_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'ACTIVE',
    "lifecycleStatus" "RecommendationLifecycleStatus" NOT NULL DEFAULT 'GENERATED',
    "utilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_versions" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "utilityScore" DOUBLE PRECISION NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_score_breakdowns" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "benefitScore" DOUBLE PRECISION NOT NULL,
    "urgencyScore" DOUBLE PRECISION NOT NULL,
    "preferenceScore" DOUBLE PRECISION NOT NULL,
    "readinessScore" DOUBLE PRECISION NOT NULL,
    "difficultyScore" DOUBLE PRECISION NOT NULL,
    "deadlineBonus" DOUBLE PRECISION NOT NULL,
    "finalUtilityScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "recommendation_score_breakdowns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_generation_contexts" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL DEFAULT 'UTILITY_DEFAULT',
    "strategyVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "utilityWeightConfiguration" JSONB NOT NULL,
    "rankingConfiguration" JSONB NOT NULL,
    "preferenceProfileVersion" INTEGER NOT NULL DEFAULT 1,
    "portfolioOptimizationVersion" INTEGER NOT NULL DEFAULT 1,
    "generationTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatorVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "configurationChecksum" TEXT NOT NULL,

    CONSTRAINT "recommendation_generation_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "citizenSnapshotId" TEXT NOT NULL,
    "eligibilitySnapshotId" TEXT NOT NULL,
    "decisionTraceId" TEXT NOT NULL,
    "recommendationVersionId" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_portfolios" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "totalMonetaryValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_portfolio_items" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "policyTitle" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "priority" "RecommendationPriority" NOT NULL DEFAULT 'MEDIUM',
    "utilityScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "recommendation_portfolio_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_explanations" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "primaryReason" TEXT NOT NULL,
    "contributingFactors" JSONB NOT NULL,
    "readinessNotice" TEXT NOT NULL,

    CONSTRAINT "recommendation_explanations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_dependencies" (
    "id" TEXT NOT NULL,
    "sourcePolicyId" TEXT NOT NULL,
    "targetPolicyId" TEXT NOT NULL,
    "dependencyType" TEXT NOT NULL DEFAULT 'REQUIRES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_histories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_differences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changeType" "RecommendationChangeType" NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyTitle" TEXT NOT NULL,
    "oldRank" INTEGER,
    "newRank" INTEGER,
    "oldUtilityScore" DOUBLE PRECISION,
    "newUtilityScore" DOUBLE PRECISION,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_differences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rankingTimeMs" INTEGER NOT NULL DEFAULT 0,
    "portfolioOptimizationTimeMs" INTEGER NOT NULL DEFAULT 0,
    "explanationGenerationTimeMs" INTEGER NOT NULL DEFAULT 0,
    "snapshotCreationTimeMs" INTEGER NOT NULL DEFAULT 0,
    "recommendationDiffTimeMs" INTEGER NOT NULL DEFAULT 0,
    "averageRecommendationScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageBenefitValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageApplicationReadinessPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averagePortfolioSize" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "topRecommendedSchemes" JSONB NOT NULL,
    "recommendationFailureRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredCategories" JSONB NOT NULL,
    "maxDifficultyTolerance" INTEGER NOT NULL DEFAULT 3,
    "prioritizeMonetaryValue" BOOLEAN NOT NULL DEFAULT true,
    "prioritizeUrgency" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_utility_scores" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "baseMonetaryScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "difficultyPenalty" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "urgencyBonus" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "computedUtility" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_utility_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_readiness" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "status" "ApplicationReadinessStatus" NOT NULL DEFAULT 'NOT_READY',
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "missingFacts" JSONB NOT NULL,
    "missingDocuments" JSONB NOT NULL,
    "verificationGaps" JSONB NOT NULL,
    "expiredEvidence" JSONB NOT NULL,
    "missingOnboardingAnswers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_readiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_feedbacks" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "RecommendationFeedbackAction" NOT NULL DEFAULT 'VIEWED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_blueprints" (
    "id" TEXT NOT NULL,
    "parentBlueprintId" TEXT,
    "policyId" TEXT NOT NULL,
    "policyTitle" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journey_blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_blueprint_versions" (
    "id" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "steps" JSONB NOT NULL,
    "documentRequirements" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journey_blueprint_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_journeys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyTitle" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "status" "ApplicationJourneyStatus" NOT NULL DEFAULT 'CREATED',
    "urgency" "JourneyUrgency" NOT NULL DEFAULT 'MEDIUM',
    "readinessScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_journey_steps" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "stepCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "JourneyStepStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "order" INTEGER NOT NULL DEFAULT 1,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "executionMode" "StepExecutionMode" NOT NULL DEFAULT 'MANUAL',
    "owner" "StepOwner" NOT NULL DEFAULT 'CITIZEN',
    "retryLimit" INTEGER NOT NULL DEFAULT 3,
    "retryIntervalMs" INTEGER NOT NULL DEFAULT 60000,
    "blockingBehavior" "StepBlockingBehavior" NOT NULL DEFAULT 'BLOCKING',
    "timeoutMs" INTEGER NOT NULL DEFAULT 86400000,
    "requiresVerification" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_journey_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_step_dependencies" (
    "id" TEXT NOT NULL,
    "sourceStepId" TEXT NOT NULL,
    "targetStepId" TEXT NOT NULL,
    "dependencyType" "JourneyDependencyType" NOT NULL DEFAULT 'REQUIRES',

    CONSTRAINT "application_step_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_checklists" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "status" "ChecklistStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FACT',
    "status" "ChecklistStatus" NOT NULL DEFAULT 'PENDING',
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_requirements" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "acceptedFormats" JSONB NOT NULL,
    "maxAgeDays" INTEGER,
    "maxSizeBytes" INTEGER NOT NULL DEFAULT 5242880,
    "issuingAuthority" TEXT NOT NULL,
    "requiresVerification" BOOLEAN NOT NULL DEFAULT true,
    "status" "DocumentRequirementStatus" NOT NULL DEFAULT 'REQUIRED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_readiness" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "citizenFactsPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "documentsPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "evidencePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "verificationPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "applicationStatusPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "dependencyPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "missingItemsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journey_readiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_plans" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_plan_steps" (
    "id" TEXT NOT NULL,
    "actionPlanId" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL DEFAULT 'TODAY',
    "stepTitle" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "priority" "JourneyUrgency" NOT NULL DEFAULT 'MEDIUM',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_plan_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_snapshots" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "citizenSnapshotId" TEXT NOT NULL,
    "eligibilitySnapshotId" TEXT NOT NULL,
    "recommendationSnapshotId" TEXT NOT NULL,
    "journeyVersion" INTEGER NOT NULL DEFAULT 1,
    "snapshotData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journey_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_histories" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journey_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_timelines" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "eventType" "TimelineEventType" NOT NULL DEFAULT 'JOURNEY_CREATED',
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journey_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_progresses" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "type" "JourneyProgressType" NOT NULL DEFAULT 'OVERALL',
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "details" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journey_progresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_differences" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journey_differences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_analytics" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "averageJourneyDurationMs" INTEGER NOT NULL DEFAULT 0,
    "averageApprovalDurationMs" INTEGER NOT NULL DEFAULT 0,
    "averageStepDurationMs" INTEGER NOT NULL DEFAULT 0,
    "averageWaitingTimeMs" INTEGER NOT NULL DEFAULT 0,
    "averageVerificationTimeMs" INTEGER NOT NULL DEFAULT 0,
    "longestBlockingStepTitle" TEXT NOT NULL DEFAULT '',
    "deadlineMissRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "journeyReplayDurationMs" INTEGER NOT NULL DEFAULT 0,
    "snapshotCreationDurationMs" INTEGER NOT NULL DEFAULT 0,
    "blueprintReusePercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "mostFailedStepTitle" TEXT NOT NULL DEFAULT '',
    "mostRepeatedStepTitle" TEXT NOT NULL DEFAULT '',
    "averageCitizenCompletionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageGovernmentProcessingPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "dependencyResolutionTimeMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journey_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journey_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "source" "DocumentSource" NOT NULL DEFAULT 'CITIZEN_UPLOAD',
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_aliases" (
    "id" TEXT NOT NULL,
    "originalDocumentId" TEXT NOT NULL,
    "aliasDocumentId" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_classifications" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentCategory" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "detectedLanguage" TEXT NOT NULL DEFAULT 'en',
    "pageOrientation" TEXT NOT NULL DEFAULT 'PORTRAIT',
    "layoutType" TEXT NOT NULL DEFAULT 'SINGLE_PAGE',
    "ocrTemplateId" TEXT,
    "isOcrRequired" BOOLEAN NOT NULL DEFAULT true,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "isSupported" BOOLEAN NOT NULL DEFAULT true,
    "classificationConfidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_qualities" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "qualityGrade" "DocumentQualityGrade" NOT NULL DEFAULT 'EXCELLENT',
    "ocrReadiness" "OCRReadiness" NOT NULL DEFAULT 'READY',
    "resolutionDpi" INTEGER NOT NULL DEFAULT 300,
    "isBlurred" BOOLEAN NOT NULL DEFAULT false,
    "noiseLevel" TEXT NOT NULL DEFAULT 'LOW',
    "contrastScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "issues" JSONB,
    "recommendedFixes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_qualities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_jobs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" "OCRStatus" NOT NULL DEFAULT 'QUEUED',
    "totalBlocks" INTEGER NOT NULL DEFAULT 0,
    "averageConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ocr_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_blocks" (
    "id" TEXT NOT NULL,
    "ocrJobId" TEXT NOT NULL,
    "blockType" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "boundingPoly" JSONB,

    CONSTRAINT "ocr_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extracted_facts" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "factKey" TEXT NOT NULL,
    "extractedValue" JSONB NOT NULL,
    "rawText" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extracted_facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidences" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "factKey" TEXT NOT NULL,
    "factValue" JSONB NOT NULL,
    "status" "EvidenceStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_versions" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "factKey" TEXT NOT NULL,
    "factValue" JSONB NOT NULL,
    "status" "EvidenceStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_trust_scores" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "documentAgeDays" INTEGER NOT NULL DEFAULT 0,
    "verificationMethodWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "governmentSourceWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "manualVerificationBonus" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "ocrQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "documentQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "extractionConfidence" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "conflictHistoryPenalty" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "confidenceLevel" "DocumentConfidenceLevel" NOT NULL DEFAULT 'HIGH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_trust_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "method" "VerificationMethod" NOT NULL DEFAULT 'CITIZEN_UPLOAD',
    "verifiedBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_steps" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_actors" (
    "id" TEXT NOT NULL,
    "actorCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "actorType" TEXT NOT NULL DEFAULT 'SYSTEM',
    "trustRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_actors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_conflicts" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "factKey" TEXT NOT NULL,
    "declaredValue" JSONB NOT NULL,
    "extractedValue" JSONB NOT NULL,
    "status" "ConflictStatus" NOT NULL DEFAULT 'DETECTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fact_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_reconciliations" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "factKey" TEXT NOT NULL,
    "resolutionType" "ConflictResolutionType" NOT NULL DEFAULT 'ACCEPT_DOCUMENT',
    "finalValue" JSONB NOT NULL,
    "reconciledBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "reconciledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_checksums" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_checksums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_expiries" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "daysRemaining" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'VALID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_expiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_graphs" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "factKey" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "ocrBlockId" TEXT,
    "originalFileName" TEXT NOT NULL,
    "provenanceChain" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_graphs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_templates" (
    "id" TEXT NOT NULL,
    "templateCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "rulesJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocr_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_analytics" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "totalDocumentsUploaded" INTEGER NOT NULL DEFAULT 0,
    "totalVerifiedDocuments" INTEGER NOT NULL DEFAULT 0,
    "totalConflictedDocuments" INTEGER NOT NULL DEFAULT 0,
    "averageQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "averageTrustScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "averageOcrConfidence" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "deduplicationSavingsCount" INTEGER NOT NULL DEFAULT 0,
    "mostUploadedDocumentType" TEXT NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizen_fact_versions" (
    "id" TEXT NOT NULL,
    "factId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "source" TEXT NOT NULL DEFAULT 'SELF_DECLARED',
    "sourcePrecedence" INTEGER NOT NULL DEFAULT 5,
    "provenance" JSONB,
    "verificationStatus" TEXT NOT NULL DEFAULT 'SELF_DECLARED',
    "freshnessPolicyVersion" INTEGER NOT NULL DEFAULT 1,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "changeReason" TEXT,
    "changedBy" TEXT NOT NULL,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citizen_fact_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_provenances" (
    "id" TEXT NOT NULL,
    "factId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceReferenceId" TEXT,
    "documentId" TEXT,
    "evidenceId" TEXT,
    "actorId" TEXT,
    "verificationMethod" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_provenances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_freshness_policies" (
    "id" TEXT NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "expiryDurationDays" INTEGER NOT NULL DEFAULT 365,
    "warningWindowDays" INTEGER NOT NULL DEFAULT 30,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_freshness_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_questions" (
    "id" TEXT NOT NULL,
    "questionCode" TEXT NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_question_versions" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "questionText" TEXT NOT NULL,
    "helpText" TEXT,
    "inputType" "QuestionInputType" NOT NULL DEFAULT 'TEXT',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "explanationTemplate" TEXT NOT NULL DEFAULT 'Required for profile completion.',
    "scoringWeights" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_question_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" TEXT NOT NULL,
    "questionVersionId" TEXT NOT NULL,
    "optionCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_dependencies" (
    "id" TEXT NOT NULL,
    "dependentQuestionId" TEXT NOT NULL,
    "parentQuestionId" TEXT NOT NULL,
    "parentAttributeKey" TEXT NOT NULL,
    "operator" TEXT NOT NULL DEFAULT 'EQUALS',
    "expectedValue" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_answers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionVersionId" TEXT NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "answerValue" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_answer_versions" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB NOT NULL,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_answer_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_snapshots" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "facts" JSONB NOT NULL,
    "factVersions" JSONB NOT NULL,
    "sourcePrecedencePolicyVersion" INTEGER NOT NULL DEFAULT 1,
    "freshnessPolicyVersions" JSONB NOT NULL,
    "completenessConfigurationVersion" INTEGER NOT NULL DEFAULT 1,
    "questionCatalogVersion" INTEGER NOT NULL DEFAULT 1,
    "prioritizationConfigurationVersion" INTEGER NOT NULL DEFAULT 1,
    "checksumSha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_changes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changedFactKey" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "eligibilityReEvaluationRequired" BOOLEAN NOT NULL DEFAULT false,
    "recommendationRecalculationRequired" BOOLEAN NOT NULL DEFAULT false,
    "journeyRevalidationRequired" BOOLEAN NOT NULL DEFAULT false,
    "documentReverificationRequired" BOOLEAN NOT NULL DEFAULT false,
    "noDownstreamImpact" BOOLEAN NOT NULL DEFAULT false,
    "impactReason" TEXT NOT NULL,
    "triggerFactValue" JSONB,
    "affectedDomains" JSONB NOT NULL,
    "configurationVersion" INTEGER NOT NULL DEFAULT 1,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_explanations" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionCode" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "requiredForSchemes" JSONB NOT NULL,
    "unlockedRecommendations" JSONB NOT NULL,
    "missingPrerequisiteForJourneys" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_explanations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_analytics" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "onboardingCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageOnboardingDurationSec" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "questionAbandonmentRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageQuestionsPerCitizen" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "questionSkipRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "profileCompletenessPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "factAcquisitionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "staleFactRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "conflictRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "verificationCoverage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventVersion" TEXT NOT NULL DEFAULT '1.0',
    "aggregateId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL DEFAULT 'ONBOARDING',
    "userId" TEXT NOT NULL,
    "correlationId" TEXT,
    "causationId" TEXT,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_prioritization_configs" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "eligibilityRelevanceWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    "recommendationUnlockWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "criticalFactImpactWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "downstreamDependencyWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "citizenEffortPenaltyWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_prioritization_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_verification_policies" (
    "id" TEXT NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "acceptableSources" JSONB NOT NULL,
    "minimumTrustScore" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
    "freshnessExpiryDurationDays" INTEGER NOT NULL DEFAULT 365,
    "requireManualReviewForGovernmentExpired" BOOLEAN NOT NULL DEFAULT true,
    "requireManualReviewForConflicts" BOOLEAN NOT NULL DEFAULT true,
    "checksumSha256" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_verification_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_verification_runs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "factId" TEXT NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "policyConfiguration" JSONB NOT NULL,
    "policyChecksumSha256" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fact_verification_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_verification_resolutions" (
    "id" TEXT NOT NULL,
    "verificationRunId" TEXT NOT NULL,
    "factId" TEXT NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "winningValue" JSONB NOT NULL,
    "winningSource" TEXT NOT NULL,
    "winningSourcePrecedence" INTEGER NOT NULL,
    "losingValues" JSONB NOT NULL,
    "strategy" TEXT NOT NULL,
    "resolutionReason" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "policyChecksumSha256" TEXT NOT NULL,
    "resolvedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_verification_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_verification_reviews" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "reason" TEXT NOT NULL,
    "requiredEvidenceTypes" JSONB NOT NULL,
    "assignedReviewerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "slaDeadline" TIMESTAMP(3) NOT NULL,
    "reviewerDecision" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fact_verification_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_verification_snapshots" (
    "id" TEXT NOT NULL,
    "verificationRunId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "factId" TEXT NOT NULL,
    "canonicalValue" JSONB NOT NULL,
    "canonicalSource" TEXT NOT NULL,
    "freshnessStatus" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "policyConfiguration" JSONB NOT NULL,
    "policyChecksumSha256" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_verification_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_verification_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventVersion" TEXT NOT NULL DEFAULT '1.0',
    "aggregateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "correlationId" TEXT,
    "causationId" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_verification_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_verification_analytics" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationSuccessRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "conflictRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "manualReviewRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageResolutionTimeSec" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "staleFactRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "trustScoreAverage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_verification_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_re_evaluations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerEntityId" TEXT NOT NULL,
    "triggerEntityVersion" INTEGER NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "rootEventId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "causationId" TEXT,
    "propagationDepth" INTEGER NOT NULL DEFAULT 1,
    "idempotencyKey" TEXT NOT NULL,
    "dependencyFingerprintSha256" TEXT NOT NULL,
    "configurationVersion" INTEGER NOT NULL DEFAULT 1,
    "configurationChecksumSha256" TEXT NOT NULL,
    "failureReason" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decision_re_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_impacts" (
    "id" TEXT NOT NULL,
    "reEvaluationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "impactType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "sourceFactId" TEXT,
    "sourceFactVersion" INTEGER,
    "sourceEventId" TEXT NOT NULL,
    "oldDependencyVersion" INTEGER,
    "newDependencyVersion" INTEGER,
    "dependencyFingerprintSha256" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "requiresReEvaluation" BOOLEAN NOT NULL DEFAULT true,
    "isEvaluated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_impacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_re_evaluation_steps" (
    "id" TEXT NOT NULL,
    "reEvaluationId" TEXT NOT NULL,
    "stepType" TEXT NOT NULL,
    "executionOrder" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "inputSnapshotId" TEXT,
    "outputSnapshotId" TEXT,
    "dependencyFingerprintSha256" TEXT NOT NULL,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_re_evaluation_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_state_snapshots" (
    "id" TEXT NOT NULL,
    "reEvaluationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "snapshotType" TEXT NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "dependencyVersions" JSONB NOT NULL,
    "dependencyFingerprintSha256" TEXT NOT NULL,
    "policyVersions" JSONB NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_state_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_diffs" (
    "id" TEXT NOT NULL,
    "reEvaluationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "changedFields" JSONB NOT NULL,
    "previousState" JSONB NOT NULL,
    "newState" JSONB NOT NULL,
    "isMaterial" BOOLEAN NOT NULL DEFAULT false,
    "materialityReason" TEXT NOT NULL,
    "materialityRuleVersion" INTEGER NOT NULL DEFAULT 1,
    "materialityConfigurationChecksumSha256" TEXT NOT NULL,
    "dependencyFingerprintSha256" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_diffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stale_states" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "dependencyId" TEXT NOT NULL,
    "oldDependencyVersion" INTEGER NOT NULL,
    "currentDependencyVersion" INTEGER NOT NULL,
    "dependencyFingerprintSha256" TEXT NOT NULL,
    "staleReason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'STALE',
    "reEvaluationId" TEXT,
    "staleAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clearedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stale_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_version_activations" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyTitle" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "activationReason" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "affectedFacts" JSONB NOT NULL,
    "affectedRules" JSONB NOT NULL,
    "affectedAttributeKeys" JSONB NOT NULL,
    "discoveredPopulationCount" INTEGER NOT NULL DEFAULT 0,
    "populationSelectionChecksum" TEXT NOT NULL,
    "activatedBy" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_version_activations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "actionItemId" TEXT,
    "sourceReEvaluationId" TEXT NOT NULL,
    "sourceDecisionDiffId" TEXT NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "policyChecksumSha256" TEXT NOT NULL,
    "dependencyFingerprintSha256" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "supersededByNotificationId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "templateParameters" JSONB,
    "readAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "providerName" TEXT,
    "deliveryIdempotencyKey" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "failureCategory" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_delivery_attempts" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "failureCategory" TEXT,
    "durationMs" INTEGER NOT NULL,
    "providerMessageId" TEXT,
    "requestPayloadSanitized" JSONB,
    "responsePayloadSanitized" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_delivery_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizen_action_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "targetUrl" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "sourceEntityId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "completedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizen_action_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_template_versions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-IN',
    "titleTemplate" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "actionUrlTemplate" TEXT,
    "checksumSha256" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_policy_versions" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "minMaterialityLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "cooldownWindowSeconds" INTEGER NOT NULL DEFAULT 300,
    "maxPerWindow" INTEGER NOT NULL DEFAULT 3,
    "allowedChannels" JSONB NOT NULL,
    "fallbackPrecedence" JSONB NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "activatedBy" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_policy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ENABLED',
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "categoryOverrides" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_suppressions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "sourceDecisionDiffId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "suppressionReason" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "policyChecksumSha256" TEXT NOT NULL,
    "originalEvaluationTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextEligibleDeliveryTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_suppressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_outbox" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "auth_identities_userId_idx" ON "auth_identities"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_identities_provider_providerUserId_key" ON "auth_identities"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_name_idx" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_action_key" ON "permissions"("action");

-- CreateIndex
CREATE INDEX "permissions_action_idx" ON "permissions"("action");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_sessions_tokenHash_key" ON "refresh_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_sessions_userId_idx" ON "refresh_sessions"("userId");

-- CreateIndex
CREATE INDEX "refresh_sessions_tokenHash_idx" ON "refresh_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "login_histories_userId_createdAt_idx" ON "login_histories"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "login_histories_email_idx" ON "login_histories"("email");

-- CreateIndex
CREATE UNIQUE INDEX "citizen_profiles_userId_key" ON "citizen_profiles"("userId");

-- CreateIndex
CREATE INDEX "citizen_profiles_userId_idx" ON "citizen_profiles"("userId");

-- CreateIndex
CREATE INDEX "citizen_profiles_status_idx" ON "citizen_profiles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "citizen_attribute_registry_key_key" ON "citizen_attribute_registry"("key");

-- CreateIndex
CREATE INDEX "citizen_attribute_registry_key_idx" ON "citizen_attribute_registry"("key");

-- CreateIndex
CREATE INDEX "citizen_attribute_registry_category_isActive_idx" ON "citizen_attribute_registry"("category", "isActive");

-- CreateIndex
CREATE INDEX "citizen_facts_profileId_isCurrent_idx" ON "citizen_facts"("profileId", "isCurrent");

-- CreateIndex
CREATE INDEX "citizen_facts_attributeKey_idx" ON "citizen_facts"("attributeKey");

-- CreateIndex
CREATE INDEX "citizen_facts_verificationStatus_idx" ON "citizen_facts"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "citizen_facts_profileId_attributeKey_key" ON "citizen_facts"("profileId", "attributeKey");

-- CreateIndex
CREATE INDEX "citizen_fact_history_factId_idx" ON "citizen_fact_history"("factId");

-- CreateIndex
CREATE INDEX "citizen_profile_versions_profileId_versionNumber_idx" ON "citizen_profile_versions"("profileId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "discovery_blueprints_code_key" ON "discovery_blueprints"("code");

-- CreateIndex
CREATE UNIQUE INDEX "question_catalog_questionCode_key" ON "question_catalog"("questionCode");

-- CreateIndex
CREATE INDEX "question_catalog_attributeKey_idx" ON "question_catalog"("attributeKey");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_sessions_userId_key" ON "onboarding_sessions"("userId");

-- CreateIndex
CREATE INDEX "onboarding_sessions_userId_idx" ON "onboarding_sessions"("userId");

-- CreateIndex
CREATE INDEX "onboarding_sessions_status_idx" ON "onboarding_sessions"("status");

-- CreateIndex
CREATE INDEX "onboarding_session_timelines_sessionId_createdAt_idx" ON "onboarding_session_timelines"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_analytics_blueprintId_stepKey_key" ON "onboarding_analytics"("blueprintId", "stepKey");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_sources_code_key" ON "knowledge_sources"("code");

-- CreateIndex
CREATE INDEX "knowledge_source_schedules_sourceId_idx" ON "knowledge_source_schedules"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "policy_documents_documentNumber_key" ON "policy_documents"("documentNumber");

-- CreateIndex
CREATE INDEX "policy_documents_sourceId_idx" ON "policy_documents"("sourceId");

-- CreateIndex
CREATE INDEX "policy_documents_status_idx" ON "policy_documents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "policy_versions_fingerprintHash_key" ON "policy_versions"("fingerprintHash");

-- CreateIndex
CREATE UNIQUE INDEX "policy_versions_documentId_versionNumber_key" ON "policy_versions"("documentId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "policy_relationships_sourceDocumentId_targetDocumentId_rela_key" ON "policy_relationships"("sourceDocumentId", "targetDocumentId", "relationshipType");

-- CreateIndex
CREATE INDEX "policy_chunks_documentId_versionId_idx" ON "policy_chunks"("documentId", "versionId");

-- CreateIndex
CREATE INDEX "policy_chunks_stableChunkId_idx" ON "policy_chunks"("stableChunkId");

-- CreateIndex
CREATE UNIQUE INDEX "policy_chunk_metadata_chunkId_key" ON "policy_chunk_metadata"("chunkId");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_fingerprints_fingerprintHash_key" ON "knowledge_fingerprints"("fingerprintHash");

-- CreateIndex
CREATE INDEX "knowledge_fingerprints_fingerprintHash_idx" ON "knowledge_fingerprints"("fingerprintHash");

-- CreateIndex
CREATE UNIQUE INDEX "embedding_preparations_chunkId_key" ON "embedding_preparations"("chunkId");

-- CreateIndex
CREATE INDEX "knowledge_ingestion_jobs_sourceId_status_idx" ON "knowledge_ingestion_jobs"("sourceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "policy_rules_ruleCode_key" ON "policy_rules"("ruleCode");

-- CreateIndex
CREATE UNIQUE INDEX "policy_rule_versions_ruleId_versionNumber_key" ON "policy_rule_versions"("ruleId", "versionNumber");

-- CreateIndex
CREATE INDEX "rule_conditions_attributeKey_idx" ON "rule_conditions"("attributeKey");

-- CreateIndex
CREATE UNIQUE INDEX "explainability_templates_code_key" ON "explainability_templates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "rule_dependencies_sourceRuleId_targetRuleId_dependencyType_key" ON "rule_dependencies"("sourceRuleId", "targetRuleId", "dependencyType");

-- CreateIndex
CREATE INDEX "fact_usage_indexes_attributeKey_idx" ON "fact_usage_indexes"("attributeKey");

-- CreateIndex
CREATE INDEX "decision_traces_userId_idx" ON "decision_traces"("userId");

-- CreateIndex
CREATE INDEX "decision_traces_citizenSnapshotId_idx" ON "decision_traces"("citizenSnapshotId");

-- CreateIndex
CREATE INDEX "eligibility_snapshots_userId_idx" ON "eligibility_snapshots"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_analyses_snapshotId_key" ON "opportunity_analyses"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "benefit_analyses_snapshotId_key" ON "benefit_analyses"("snapshotId");

-- CreateIndex
CREATE INDEX "evaluation_metrics_records_userId_idx" ON "evaluation_metrics_records"("userId");

-- CreateIndex
CREATE INDEX "recommendations_userId_status_idx" ON "recommendations"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_versions_recommendationId_versionNumber_key" ON "recommendation_versions"("recommendationId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_score_breakdowns_versionId_key" ON "recommendation_score_breakdowns"("versionId");

-- CreateIndex
CREATE INDEX "recommendation_snapshots_userId_idx" ON "recommendation_snapshots"("userId");

-- CreateIndex
CREATE INDEX "recommendation_portfolios_userId_idx" ON "recommendation_portfolios"("userId");

-- CreateIndex
CREATE INDEX "recommendation_portfolio_items_portfolioId_idx" ON "recommendation_portfolio_items"("portfolioId");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_dependencies_sourcePolicyId_targetPolicyId_d_key" ON "recommendation_dependencies"("sourcePolicyId", "targetPolicyId", "dependencyType");

-- CreateIndex
CREATE INDEX "recommendation_histories_userId_createdAt_idx" ON "recommendation_histories"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "recommendation_differences_userId_createdAt_idx" ON "recommendation_differences"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "recommendation_analytics_userId_idx" ON "recommendation_analytics"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_preferences_userId_key" ON "recommendation_preferences"("userId");

-- CreateIndex
CREATE INDEX "recommendation_preferences_userId_idx" ON "recommendation_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "application_readiness_versionId_key" ON "application_readiness"("versionId");

-- CreateIndex
CREATE INDEX "recommendation_feedbacks_userId_recommendationId_idx" ON "recommendation_feedbacks"("userId", "recommendationId");

-- CreateIndex
CREATE INDEX "recommendation_events_userId_eventType_idx" ON "recommendation_events"("userId", "eventType");

-- CreateIndex
CREATE INDEX "journey_blueprints_policyId_idx" ON "journey_blueprints"("policyId");

-- CreateIndex
CREATE INDEX "journey_blueprint_versions_blueprintId_version_idx" ON "journey_blueprint_versions"("blueprintId", "version");

-- CreateIndex
CREATE INDEX "application_journeys_userId_idx" ON "application_journeys"("userId");

-- CreateIndex
CREATE INDEX "application_journeys_status_idx" ON "application_journeys"("status");

-- CreateIndex
CREATE INDEX "application_journey_steps_journeyId_idx" ON "application_journey_steps"("journeyId");

-- CreateIndex
CREATE INDEX "application_step_dependencies_sourceStepId_targetStepId_idx" ON "application_step_dependencies"("sourceStepId", "targetStepId");

-- CreateIndex
CREATE UNIQUE INDEX "application_checklists_journeyId_key" ON "application_checklists"("journeyId");

-- CreateIndex
CREATE INDEX "checklist_items_checklistId_idx" ON "checklist_items"("checklistId");

-- CreateIndex
CREATE INDEX "document_requirements_policyId_idx" ON "document_requirements"("policyId");

-- CreateIndex
CREATE UNIQUE INDEX "journey_readiness_journeyId_key" ON "journey_readiness"("journeyId");

-- CreateIndex
CREATE UNIQUE INDEX "action_plans_journeyId_key" ON "action_plans"("journeyId");

-- CreateIndex
CREATE INDEX "action_plan_steps_actionPlanId_idx" ON "action_plan_steps"("actionPlanId");

-- CreateIndex
CREATE INDEX "journey_snapshots_journeyId_idx" ON "journey_snapshots"("journeyId");

-- CreateIndex
CREATE INDEX "journey_snapshots_userId_idx" ON "journey_snapshots"("userId");

-- CreateIndex
CREATE INDEX "journey_histories_journeyId_idx" ON "journey_histories"("journeyId");

-- CreateIndex
CREATE INDEX "journey_timelines_journeyId_idx" ON "journey_timelines"("journeyId");

-- CreateIndex
CREATE INDEX "journey_progresses_journeyId_idx" ON "journey_progresses"("journeyId");

-- CreateIndex
CREATE INDEX "journey_differences_journeyId_idx" ON "journey_differences"("journeyId");

-- CreateIndex
CREATE INDEX "journey_analytics_userId_idx" ON "journey_analytics"("userId");

-- CreateIndex
CREATE INDEX "journey_events_userId_eventType_idx" ON "journey_events"("userId", "eventType");

-- CreateIndex
CREATE INDEX "documents_userId_idx" ON "documents"("userId");

-- CreateIndex
CREATE INDEX "documents_checksumSha256_idx" ON "documents"("checksumSha256");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- CreateIndex
CREATE INDEX "documents_documentType_idx" ON "documents"("documentType");

-- CreateIndex
CREATE INDEX "document_versions_documentId_version_idx" ON "document_versions"("documentId", "version");

-- CreateIndex
CREATE INDEX "document_aliases_originalDocumentId_idx" ON "document_aliases"("originalDocumentId");

-- CreateIndex
CREATE INDEX "document_aliases_checksumSha256_idx" ON "document_aliases"("checksumSha256");

-- CreateIndex
CREATE UNIQUE INDEX "document_classifications_documentId_key" ON "document_classifications"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "document_qualities_documentId_key" ON "document_qualities"("documentId");

-- CreateIndex
CREATE INDEX "ocr_jobs_documentId_idx" ON "ocr_jobs"("documentId");

-- CreateIndex
CREATE INDEX "ocr_blocks_ocrJobId_idx" ON "ocr_blocks"("ocrJobId");

-- CreateIndex
CREATE INDEX "extracted_facts_documentId_factKey_idx" ON "extracted_facts"("documentId", "factKey");

-- CreateIndex
CREATE INDEX "evidences_documentId_idx" ON "evidences"("documentId");

-- CreateIndex
CREATE INDEX "evidences_userId_factKey_idx" ON "evidences"("userId", "factKey");

-- CreateIndex
CREATE INDEX "evidence_versions_evidenceId_version_idx" ON "evidence_versions"("evidenceId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_trust_scores_evidenceId_key" ON "evidence_trust_scores"("evidenceId");

-- CreateIndex
CREATE INDEX "verifications_documentId_idx" ON "verifications"("documentId");

-- CreateIndex
CREATE INDEX "verifications_userId_status_idx" ON "verifications"("userId", "status");

-- CreateIndex
CREATE INDEX "verification_steps_verificationId_idx" ON "verification_steps"("verificationId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_actors_actorCode_key" ON "verification_actors"("actorCode");

-- CreateIndex
CREATE INDEX "fact_conflicts_documentId_idx" ON "fact_conflicts"("documentId");

-- CreateIndex
CREATE INDEX "fact_conflicts_userId_factKey_idx" ON "fact_conflicts"("userId", "factKey");

-- CreateIndex
CREATE INDEX "fact_reconciliations_conflictId_idx" ON "fact_reconciliations"("conflictId");

-- CreateIndex
CREATE INDEX "fact_reconciliations_documentId_idx" ON "fact_reconciliations"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "document_checksums_documentId_key" ON "document_checksums"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "document_checksums_checksumSha256_key" ON "document_checksums"("checksumSha256");

-- CreateIndex
CREATE INDEX "document_expiries_documentId_idx" ON "document_expiries"("documentId");

-- CreateIndex
CREATE INDEX "evidence_graphs_evidenceId_idx" ON "evidence_graphs"("evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ocr_templates_templateCode_key" ON "ocr_templates"("templateCode");

-- CreateIndex
CREATE INDEX "document_analytics_userId_idx" ON "document_analytics"("userId");

-- CreateIndex
CREATE INDEX "document_events_userId_eventType_idx" ON "document_events"("userId", "eventType");

-- CreateIndex
CREATE INDEX "citizen_fact_versions_factId_version_idx" ON "citizen_fact_versions"("factId", "version");

-- CreateIndex
CREATE INDEX "fact_provenances_factId_idx" ON "fact_provenances"("factId");

-- CreateIndex
CREATE UNIQUE INDEX "fact_freshness_policies_attributeKey_version_key" ON "fact_freshness_policies"("attributeKey", "version");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_questions_questionCode_key" ON "onboarding_questions"("questionCode");

-- CreateIndex
CREATE INDEX "onboarding_questions_attributeKey_idx" ON "onboarding_questions"("attributeKey");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_question_versions_questionId_version_key" ON "onboarding_question_versions"("questionId", "version");

-- CreateIndex
CREATE INDEX "question_options_questionVersionId_idx" ON "question_options"("questionVersionId");

-- CreateIndex
CREATE INDEX "question_dependencies_dependentQuestionId_idx" ON "question_dependencies"("dependentQuestionId");

-- CreateIndex
CREATE INDEX "question_dependencies_parentQuestionId_idx" ON "question_dependencies"("parentQuestionId");

-- CreateIndex
CREATE INDEX "onboarding_answers_sessionId_idx" ON "onboarding_answers"("sessionId");

-- CreateIndex
CREATE INDEX "onboarding_answers_userId_attributeKey_idx" ON "onboarding_answers"("userId", "attributeKey");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_answers_userId_idempotencyKey_key" ON "onboarding_answers"("userId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "onboarding_answer_versions_answerId_version_idx" ON "onboarding_answer_versions"("answerId", "version");

-- CreateIndex
CREATE INDEX "profile_snapshots_profileId_versionNumber_idx" ON "profile_snapshots"("profileId", "versionNumber");

-- CreateIndex
CREATE INDEX "profile_changes_userId_createdAt_idx" ON "profile_changes"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "question_explanations_questionId_idx" ON "question_explanations"("questionId");

-- CreateIndex
CREATE INDEX "profile_analytics_userId_idx" ON "profile_analytics"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_events_eventId_key" ON "onboarding_events"("eventId");

-- CreateIndex
CREATE INDEX "onboarding_events_userId_eventType_idx" ON "onboarding_events"("userId", "eventType");

-- CreateIndex
CREATE INDEX "question_prioritization_configs_version_idx" ON "question_prioritization_configs"("version");

-- CreateIndex
CREATE UNIQUE INDEX "fact_verification_policies_attributeKey_version_key" ON "fact_verification_policies"("attributeKey", "version");

-- CreateIndex
CREATE INDEX "fact_verification_runs_userId_factId_idx" ON "fact_verification_runs"("userId", "factId");

-- CreateIndex
CREATE UNIQUE INDEX "fact_verification_runs_userId_idempotencyKey_key" ON "fact_verification_runs"("userId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "fact_verification_resolutions_factId_verificationRunId_idx" ON "fact_verification_resolutions"("factId", "verificationRunId");

-- CreateIndex
CREATE INDEX "fact_verification_reviews_citizenId_status_idx" ON "fact_verification_reviews"("citizenId", "status");

-- CreateIndex
CREATE INDEX "fact_verification_reviews_assignedReviewerId_idx" ON "fact_verification_reviews"("assignedReviewerId");

-- CreateIndex
CREATE INDEX "fact_verification_snapshots_citizenId_factId_idx" ON "fact_verification_snapshots"("citizenId", "factId");

-- CreateIndex
CREATE UNIQUE INDEX "fact_verification_events_eventId_key" ON "fact_verification_events"("eventId");

-- CreateIndex
CREATE INDEX "fact_verification_events_userId_eventType_idx" ON "fact_verification_events"("userId", "eventType");

-- CreateIndex
CREATE INDEX "fact_verification_analytics_userId_idx" ON "fact_verification_analytics"("userId");

-- CreateIndex
CREATE INDEX "decision_re_evaluations_status_leaseExpiresAt_idx" ON "decision_re_evaluations"("status", "leaseExpiresAt");

-- CreateIndex
CREATE INDEX "decision_re_evaluations_userId_status_idx" ON "decision_re_evaluations"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "decision_re_evaluations_userId_idempotencyKey_key" ON "decision_re_evaluations"("userId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "decision_impacts_reEvaluationId_targetType_idx" ON "decision_impacts"("reEvaluationId", "targetType");

-- CreateIndex
CREATE UNIQUE INDEX "decision_impacts_sourceEventId_targetType_targetEntityId_key" ON "decision_impacts"("sourceEventId", "targetType", "targetEntityId");

-- CreateIndex
CREATE UNIQUE INDEX "decision_re_evaluation_steps_reEvaluationId_executionOrder_key" ON "decision_re_evaluation_steps"("reEvaluationId", "executionOrder");

-- CreateIndex
CREATE INDEX "decision_state_snapshots_userId_targetType_targetEntityId_idx" ON "decision_state_snapshots"("userId", "targetType", "targetEntityId");

-- CreateIndex
CREATE INDEX "decision_diffs_reEvaluationId_targetType_idx" ON "decision_diffs"("reEvaluationId", "targetType");

-- CreateIndex
CREATE UNIQUE INDEX "stale_states_userId_targetType_targetEntityId_key" ON "stale_states"("userId", "targetType", "targetEntityId");

-- CreateIndex
CREATE UNIQUE INDEX "policy_version_activations_policyId_version_key" ON "policy_version_activations"("policyId", "version");

-- CreateIndex
CREATE INDEX "notifications_userId_status_idx" ON "notifications"("userId", "status");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_sourceDecisionDiffId_idx" ON "notifications"("sourceDecisionDiffId");

-- CreateIndex
CREATE INDEX "notifications_sourceReEvaluationId_idx" ON "notifications"("sourceReEvaluationId");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_userId_idempotencyKey_key" ON "notifications"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_sourceEventId_notificationType_userId_key" ON "notifications"("sourceEventId", "notificationType", "userId");

-- CreateIndex
CREATE INDEX "notification_deliveries_status_scheduledAt_leaseExpiresAt_n_idx" ON "notification_deliveries"("status", "scheduledAt", "leaseExpiresAt", "nextRetryAt");

-- CreateIndex
CREATE INDEX "notification_deliveries_userId_channel_idx" ON "notification_deliveries"("userId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "notification_deliveries_notificationId_channel_key" ON "notification_deliveries"("notificationId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "notification_deliveries_deliveryIdempotencyKey_key" ON "notification_deliveries"("deliveryIdempotencyKey");

-- CreateIndex
CREATE INDEX "notification_delivery_attempts_deliveryId_idx" ON "notification_delivery_attempts"("deliveryId");

-- CreateIndex
CREATE INDEX "notification_delivery_attempts_notificationId_channel_idx" ON "notification_delivery_attempts"("notificationId", "channel");

-- CreateIndex
CREATE INDEX "citizen_action_items_userId_status_idx" ON "citizen_action_items"("userId", "status");

-- CreateIndex
CREATE INDEX "citizen_action_items_userId_deadline_idx" ON "citizen_action_items"("userId", "deadline");

-- CreateIndex
CREATE INDEX "citizen_action_items_sourceEntityId_idx" ON "citizen_action_items"("sourceEntityId");

-- CreateIndex
CREATE UNIQUE INDEX "citizen_action_items_userId_idempotencyKey_key" ON "citizen_action_items"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "notification_template_versions_templateId_version_locale_key" ON "notification_template_versions"("templateId", "version", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "notification_policy_versions_policyId_version_key" ON "notification_policy_versions"("policyId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_channel_key" ON "notification_preferences"("userId", "channel");

-- CreateIndex
CREATE INDEX "notification_suppressions_userId_notificationType_idx" ON "notification_suppressions"("userId", "notificationType");

-- CreateIndex
CREATE INDEX "notification_suppressions_sourceDecisionDiffId_idx" ON "notification_suppressions"("sourceDecisionDiffId");

-- CreateIndex
CREATE INDEX "notification_outbox_status_scheduledAt_leaseExpiresAt_idx" ON "notification_outbox"("status", "scheduledAt", "leaseExpiresAt");

-- AddForeignKey
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_histories" ADD CONSTRAINT "login_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_profiles" ADD CONSTRAINT "citizen_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_facts" ADD CONSTRAINT "citizen_facts_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "citizen_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_facts" ADD CONSTRAINT "citizen_facts_attributeKey_fkey" FOREIGN KEY ("attributeKey") REFERENCES "citizen_attribute_registry"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_facts" ADD CONSTRAINT "citizen_facts_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "fact_evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_fact_history" ADD CONSTRAINT "citizen_fact_history_factId_fkey" FOREIGN KEY ("factId") REFERENCES "citizen_facts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_profile_versions" ADD CONSTRAINT "citizen_profile_versions_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "citizen_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_catalog" ADD CONSTRAINT "question_catalog_attributeKey_fkey" FOREIGN KEY ("attributeKey") REFERENCES "citizen_attribute_registry"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "discovery_blueprints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_session_timelines" ADD CONSTRAINT "onboarding_session_timelines_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "onboarding_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_source_schedules" ADD CONSTRAINT "knowledge_source_schedules_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_documents" ADD CONSTRAINT "policy_documents_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_versions" ADD CONSTRAINT "policy_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "policy_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_relationships" ADD CONSTRAINT "policy_relationships_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "policy_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_relationships" ADD CONSTRAINT "policy_relationships_targetDocumentId_fkey" FOREIGN KEY ("targetDocumentId") REFERENCES "policy_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_chunks" ADD CONSTRAINT "policy_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "policy_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_chunks" ADD CONSTRAINT "policy_chunks_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "policy_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_chunk_metadata" ADD CONSTRAINT "policy_chunk_metadata_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "policy_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_fingerprints" ADD CONSTRAINT "knowledge_fingerprints_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "policy_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_quality_reports" ADD CONSTRAINT "knowledge_quality_reports_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "policy_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embedding_preparations" ADD CONSTRAINT "embedding_preparations_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "policy_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_ingestion_jobs" ADD CONSTRAINT "knowledge_ingestion_jobs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_rules" ADD CONSTRAINT "policy_rules_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "policy_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_rule_versions" ADD CONSTRAINT "policy_rule_versions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "policy_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_groups" ADD CONSTRAINT "rule_groups_ruleVersionId_fkey" FOREIGN KEY ("ruleVersionId") REFERENCES "policy_rule_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_groups" ADD CONSTRAINT "rule_groups_parentGroupId_fkey" FOREIGN KEY ("parentGroupId") REFERENCES "rule_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_conditions" ADD CONSTRAINT "rule_conditions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "rule_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_dependencies" ADD CONSTRAINT "rule_dependencies_sourceRuleId_fkey" FOREIGN KEY ("sourceRuleId") REFERENCES "policy_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_dependencies" ADD CONSTRAINT "rule_dependencies_targetRuleId_fkey" FOREIGN KEY ("targetRuleId") REFERENCES "policy_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_usage_indexes" ADD CONSTRAINT "fact_usage_indexes_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "rule_conditions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_traces" ADD CONSTRAINT "decision_traces_policyRuleVersionId_fkey" FOREIGN KEY ("policyRuleVersionId") REFERENCES "policy_rule_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_trace_nodes" ADD CONSTRAINT "decision_trace_nodes_traceId_fkey" FOREIGN KEY ("traceId") REFERENCES "decision_traces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_trace_edges" ADD CONSTRAINT "decision_trace_edges_traceId_fkey" FOREIGN KEY ("traceId") REFERENCES "decision_traces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eligibility_snapshots" ADD CONSTRAINT "eligibility_snapshots_decisionTraceId_fkey" FOREIGN KEY ("decisionTraceId") REFERENCES "decision_traces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eligibility_results" ADD CONSTRAINT "eligibility_results_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "eligibility_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_analyses" ADD CONSTRAINT "opportunity_analyses_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "eligibility_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_analyses" ADD CONSTRAINT "benefit_analyses_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "eligibility_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_versions" ADD CONSTRAINT "recommendation_versions_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_score_breakdowns" ADD CONSTRAINT "recommendation_score_breakdowns_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "recommendation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_snapshots" ADD CONSTRAINT "recommendation_snapshots_eligibilitySnapshotId_fkey" FOREIGN KEY ("eligibilitySnapshotId") REFERENCES "eligibility_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_snapshots" ADD CONSTRAINT "recommendation_snapshots_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "recommendation_generation_contexts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_snapshots" ADD CONSTRAINT "recommendation_snapshots_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "recommendation_portfolios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_portfolio_items" ADD CONSTRAINT "recommendation_portfolio_items_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "recommendation_portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_explanations" ADD CONSTRAINT "recommendation_explanations_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "recommendation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_readiness" ADD CONSTRAINT "application_readiness_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "recommendation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_feedbacks" ADD CONSTRAINT "recommendation_feedbacks_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_blueprints" ADD CONSTRAINT "journey_blueprints_parentBlueprintId_fkey" FOREIGN KEY ("parentBlueprintId") REFERENCES "journey_blueprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_blueprint_versions" ADD CONSTRAINT "journey_blueprint_versions_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "journey_blueprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_journeys" ADD CONSTRAINT "application_journeys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_journeys" ADD CONSTRAINT "application_journeys_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "journey_blueprints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_journey_steps" ADD CONSTRAINT "application_journey_steps_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "application_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_checklists" ADD CONSTRAINT "application_checklists_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "application_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "application_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "application_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_plan_steps" ADD CONSTRAINT "action_plan_steps_actionPlanId_fkey" FOREIGN KEY ("actionPlanId") REFERENCES "action_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_snapshots" ADD CONSTRAINT "journey_snapshots_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "application_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_histories" ADD CONSTRAINT "journey_histories_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "application_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_timelines" ADD CONSTRAINT "journey_timelines_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "application_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_progresses" ADD CONSTRAINT "journey_progresses_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "application_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_classifications" ADD CONSTRAINT "document_classifications_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_qualities" ADD CONSTRAINT "document_qualities_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_jobs" ADD CONSTRAINT "ocr_jobs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_blocks" ADD CONSTRAINT "ocr_blocks_ocrJobId_fkey" FOREIGN KEY ("ocrJobId") REFERENCES "ocr_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracted_facts" ADD CONSTRAINT "extracted_facts_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_versions" ADD CONSTRAINT "evidence_versions_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "evidences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_trust_scores" ADD CONSTRAINT "evidence_trust_scores_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "evidences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_steps" ADD CONSTRAINT "verification_steps_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "verifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_conflicts" ADD CONSTRAINT "fact_conflicts_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_reconciliations" ADD CONSTRAINT "fact_reconciliations_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "fact_conflicts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_reconciliations" ADD CONSTRAINT "fact_reconciliations_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_checksums" ADD CONSTRAINT "document_checksums_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_expiries" ADD CONSTRAINT "document_expiries_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_graphs" ADD CONSTRAINT "evidence_graphs_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "evidences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_fact_versions" ADD CONSTRAINT "citizen_fact_versions_factId_fkey" FOREIGN KEY ("factId") REFERENCES "citizen_facts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_provenances" ADD CONSTRAINT "fact_provenances_factId_fkey" FOREIGN KEY ("factId") REFERENCES "citizen_facts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_question_versions" ADD CONSTRAINT "onboarding_question_versions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "onboarding_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "onboarding_question_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_dependencies" ADD CONSTRAINT "question_dependencies_dependentQuestionId_fkey" FOREIGN KEY ("dependentQuestionId") REFERENCES "onboarding_question_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_answers" ADD CONSTRAINT "onboarding_answers_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "onboarding_question_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_answer_versions" ADD CONSTRAINT "onboarding_answer_versions_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "onboarding_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_snapshots" ADD CONSTRAINT "profile_snapshots_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "citizen_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_delivery_attempts" ADD CONSTRAINT "notification_delivery_attempts_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "notification_deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_delivery_attempts" ADD CONSTRAINT "notification_delivery_attempts_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
