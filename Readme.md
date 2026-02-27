# 🧠 RetailMind AI

### AWS-Native AI Retail SaaS for Indian SMEs

🚀 **Live Application:** [https://your-deployment-link](retail-mind-ai.vercel.app)
☁️ **Cloud-Native | Multi-Tenant | GenAI-Powered | Production-Ready**

RetailMind AI is a fully deployable, AWS-native multi-tenant SaaS platform designed for Indian SMEs.

It combines POS billing, GST-compliant onboarding, inventory intelligence, demand forecasting, competitor pricing analysis, and an AI Retail Copilot powered by Amazon Bedrock.

This system contains **no dummy data or hardcoded logic** — all workflows operate end-to-end using real infrastructure and secure authentication.

---

# 🎯 Core Capabilities

### ✅ GST-Based Business Onboarding

* Mandatory GSTIN validation
* Unique tenant creation per business
* Multi-tenant isolation at database level

### 🧾 POS Billing System

* Invoice generation
* Sales tracking
* Revenue aggregation
* RDS-backed persistence

### 📦 Inventory Management

* Real-time stock tracking
* Reorder point alerts
* Inventory turnover metrics

### 📊 Demand Forecasting

* Amazon SageMaker endpoint
* XGBoost / Prophet models
* 30-day forward demand predictions
* Forecast accuracy monitoring

### 🤖 AI Retail Copilot (Amazon Bedrock)

Powered by **Claude 3 Sonnet**

Capabilities:

* Forecast explanation
* Reorder quantity recommendation
* Pricing strategy guidance
* Profit optimization insights
* Business health advisory

### 🧠 Business Health Engine

Dynamic health score (0–100) based on:

* Revenue growth
* Gross margin %
* Inventory efficiency
* Stockout frequency
* Forecast accuracy

Risk classification and AI-generated improvement suggestions.

### 💰 Competitor Pricing Intelligence

* Lambda-based competitor scraper
* Stored in DynamoDB
* Margin comparison engine
* Market competitiveness scoring
* AI-recommended optimal selling price

---

# 🏗️ Clean AWS Architecture

## 1️⃣ Frontend Layer

**Production Setup**

* Next.js (Enterprise UI)
* Hosted on Amazon S3
* Distributed via CloudFront CDN
* HTTPS via ACM

**Hackathon Demo Option**

* Streamlit UI (temporary deployment)

---

## 2️⃣ Backend Layer

**Framework:** FastAPI
**Deployed via:** EC2 / ECS / Elastic Beanstalk

Responsibilities:

* JWT Authentication
* GST-based onboarding
* Stripe subscription validation
* POS billing APIs
* Forecasting integration
* Bedrock interaction
* Business analytics engine

---

## 3️⃣ Database Layer

### Amazon RDS – PostgreSQL (Multi-Tenant)

**Core Tables**

### business

* id
* name
* gstin (unique)
* address
* created_at

### user

* id
* username (unique)
* password_hash
* role
* business_id (FK)

### product

* id
* business_id
* name
* cost_price
* selling_price
* stock
* reorder_point

### invoice

* id
* business_id
* total_amount
* created_at

### sale

* id
* invoice_id
* product_id
* quantity
* price_at_sale

All data is tenant-scoped using `business_id`.

---

# 🧠 AI & ML Layer

## A) Demand Forecasting

* Amazon SageMaker endpoint
* Model: XGBoost / Prophet
* Input: historical sales (RDS → S3 → SageMaker)
* Output: 30-day demand forecast

No mock predictions. All forecasts generated from actual sales history.

---

## B) AI Retail Copilot

**Amazon Bedrock (Claude 3 Sonnet)**

Used for:

* Forecast interpretation
* Reorder strategy
* Margin analysis
* Business health explanation
* Strategic advisory

All prompts dynamically generated using real business metrics.

---

## C) Business Health Engine

Health Score Formula:

```
health_score =
  (0.3 * revenue_growth) +
  (0.2 * margin_score) +
  (0.2 * inventory_efficiency) +
  (0.2 * stockout_score) +
  (0.1 * forecast_accuracy)
```

Outputs:

* Health Score (0–100)
* Risk category
* AI-generated corrective recommendations

---

# 💳 SaaS Subscription Layer

## Stripe Integration

Plans:

* Free
* Growth
* Pro

Flow:

1. User registers
2. GST validated
3. Stripe checkout initiated
4. Webhook verifies signature
5. Business activated

All webhooks are verified using Stripe signature validation.

---

# 🔐 Security Architecture

* JWT Authentication
* Tenant-based data isolation
* GST validation during onboarding
* API Gateway rate limiting
* AWS WAF protection
* Stripe webhook verification
* HTTPS via ACM
* IAM-based least privilege access

---

# 📊 Observability & Monitoring

* Amazon CloudWatch logs
* Auto-scaling policies
* RDS performance monitoring
* Alarm-based failure detection

---

# 🔄 Complete System Flow

1. Business registers (GST mandatory)
2. Stripe subscription validated
3. Tenant created in RDS
4. Products added
5. POS invoices generated
6. Sales stored in RDS
7. Data exported to S3
8. SageMaker trains / predicts
9. Forecast returned
10. Bedrock explains insights
11. Business health score computed
12. Competitor prices compared
13. AI recommends optimal selling price

---

# ☁️ AWS Services Used

* Amazon S3
* Amazon CloudFront
* Amazon RDS (PostgreSQL)
* Amazon DynamoDB
* AWS Lambda
* Amazon SageMaker
* Amazon Bedrock
* API Gateway
* AWS WAF
* AWS ACM
* CloudWatch

---

# 🚀 Deployment Timeline

The platform is fully deployable within 24 hours with:

* Infrastructure provisioning
* RDS setup
* SageMaker endpoint
* Bedrock access configuration
* Stripe webhook setup
* Domain + SSL configuration

---

