const Stripe = require('stripe');const Stripe = require('stripe');// services/subscriptionService.js

const { PrismaClient } = require('@prisma/client');

const { PrismaClient } = require('@prisma/client');const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const prisma = new PrismaClient();



class SubscriptionService {const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);// Only initialize Prisma if DATABASE_URL is properly configured

  

  // Subscription plans with GSTconst prisma = new PrismaClient();let prisma = null;

  static PLANS = {

    BASE: {try {

      name: 'Base Plan',

      priceId: process.env.STRIPE_BASE_PLAN_PRICE_ID,class SubscriptionService {  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('username:password')) {

      basePrice: 20,

      gst: 3.6, // 18% GST      const { PrismaClient } = require('@prisma/client');

      totalPrice: 23.6,

      downloadLimit: 5,  // Subscription plans with GST    prisma = new PrismaClient();

      interval: 'month'

    },  static PLANS = {  } else {

    PREMIUM: {

      name: 'Premium Plan',    BASE: {    console.log('⚠️  Database not configured - Subscription service running in mock mode');

      priceId: process.env.STRIPE_PREMIUM_PLAN_PRICE_ID,

      basePrice: 100,      name: 'Base Plan',  }

      gst: 18, // 18% GST

      totalPrice: 118,      priceId: process.env.STRIPE_BASE_PLAN_PRICE_ID,} catch (error) {

      downloadLimit: 20,

      interval: 'month'      basePrice: 20,  console.log('⚠️  Prisma not available - Subscription service running in mock mode');

    }

  };      gst: 3.6, // 18% GST}



  // Create or get Stripe customer      totalPrice: 23.6,

  static async getOrCreateCustomer(user) {

    try {      downloadLimit: 5,class SubscriptionService {

      // Check if user already has a Stripe customer ID

      if (user.stripeCustomerId) {      interval: 'month'  constructor() {

        const customer = await stripe.customers.retrieve(user.stripeCustomerId);

        return customer;    },    this.stripe = stripe;

      }

    PREMIUM: {  }

      // Create new Stripe customer

      const customer = await stripe.customers.create({      name: 'Premium Plan',

        email: user.email,

        name: user.displayName || user.email,      priceId: process.env.STRIPE_PREMIUM_PLAN_PRICE_ID,  // Create subscription with proper pricing

        metadata: {

          userId: user.uid      basePrice: 100,  async createSubscription(companyId, planType, customerEmail, paymentMethodId) {

        }

      });      gst: 18, // 18% GST    try {



      // Update user with Stripe customer ID      totalPrice: 118,      // Plan configuration - Updated pricing per requirements

      await prisma.user.update({

        where: { uid: user.uid },      downloadLimit: 20,      const planConfig = {

        data: { stripeCustomerId: customer.id }

      });      interval: 'month'        BASE: {



      return customer;    }          price: 20, // $20 USD base price

    } catch (error) {

      console.error('Error creating/getting Stripe customer:', error);  };          proposalLimit: 5, // 5 AI proposal generations per month

      throw new Error('Failed to create customer');

    }          downloadLimit: 5, // 5 proposal downloads per month

  }

  // Create or get Stripe customer          stripePriceId: process.env.STRIPE_BASE_PRICE_ID || 'price_base_plan',

  // Create subscription

  static async createSubscription(userId, planType) {  static async getOrCreateCustomer(user) {          description: 'Base Plan - 5 AI proposals and downloads per month'

    try {

      const user = await prisma.user.findUnique({    try {        },

        where: { uid: userId }

      });      // Check if user already has a Stripe customer ID        PREMIUM: {



      if (!user) {      if (user.stripeCustomerId) {          price: 100, // $100 USD base price  

        throw new Error('User not found');

      }        const customer = await stripe.customers.retrieve(user.stripeCustomerId);          proposalLimit: 20, // 20 AI proposal generations per month



      const customer = await this.getOrCreateCustomer(user);        return customer;          downloadLimit: 20, // 20 proposal downloads per month

      const plan = this.PLANS[planType.toUpperCase()];

      }          stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_plan',

      if (!plan) {

        throw new Error('Invalid plan type');          description: 'Premium Plan - 20 AI proposals and downloads per month'

      }

      // Create new Stripe customer        }

      // Create Stripe subscription

      const subscription = await stripe.subscriptions.create({      const customer = await stripe.customers.create({      };

        customer: customer.id,

        items: [{        email: user.email,

          price: plan.priceId

        }],        name: user.displayName || user.email,      const plan = planConfig[planType];

        payment_behavior: 'default_incomplete',

        expand: ['latest_invoice.payment_intent'],        metadata: {      if (!plan) {

        metadata: {

          userId: userId,          userId: user.uid        throw new Error('Invalid plan type');

          planType: planType

        }        }      }

      });

      });

      // Save subscription to database

      const dbSubscription = await prisma.subscription.create({      // Create or retrieve Stripe customer

        data: {

          userId: userId,      // Update user with Stripe customer ID      let customer;

          stripeSubscriptionId: subscription.id,

          stripeCustomerId: customer.id,      await prisma.user.update({      const company = await prisma.company.findUnique({

          planType: planType,

          status: subscription.status,        where: { uid: user.uid },        where: { id: companyId },

          currentPeriodStart: new Date(subscription.current_period_start * 1000),

          currentPeriodEnd: new Date(subscription.current_period_end * 1000),        data: { stripeCustomerId: customer.id }        include: { user: true }

          downloadLimit: plan.downloadLimit,

          downloadsUsed: 0      });      });

        }

      });



      return {      return customer;      if (!company) {

        subscription: dbSubscription,

        clientSecret: subscription.latest_invoice.payment_intent.client_secret    } catch (error) {        throw new Error('Company not found');

      };

    } catch (error) {      console.error('Error creating/getting Stripe customer:', error);      }

      console.error('Error creating subscription:', error);

      throw new Error('Failed to create subscription');      throw new Error('Failed to create customer');

    }

  }    }      // Check if customer already exists



  // Get user subscription  }      const existingSubscription = await prisma.subscription.findFirst({

  static async getUserSubscription(userId) {

    try {        where: { 

      const subscription = await prisma.subscription.findFirst({

        where: {  // Create subscription          companyId,

          userId: userId,

          status: {  static async createSubscription(userId, planType) {          status: 'ACTIVE'

            in: ['active', 'trialing', 'past_due']

          }    try {        }

        },

        orderBy: {      const user = await prisma.user.findUnique({      });

          createdAt: 'desc'

        }        where: { uid: userId }

      });

      });      if (existingSubscription) {

      return subscription;

    } catch (error) {        throw new Error('Company already has an active subscription');

      console.error('Error getting user subscription:', error);

      throw new Error('Failed to get subscription');      if (!user) {      }

    }

  }        throw new Error('User not found');



  // Check if user can download      }      // Create Stripe customer

  static async canUserDownload(userId) {

    try {      customer = await this.stripe.customers.create({

      const subscription = await this.getUserSubscription(userId);

            const customer = await this.getOrCreateCustomer(user);        email: customerEmail,

      if (!subscription) {

        return { canDownload: false, reason: 'No active subscription' };      const plan = this.PLANS[planType.toUpperCase()];        name: company.companyName,

      }

        metadata: {

      if (subscription.downloadsUsed >= subscription.downloadLimit) {

        return {       if (!plan) {          companyId: companyId,

          canDownload: false, 

          reason: 'Download limit reached',        throw new Error('Invalid plan type');          userId: company.userId

          limit: subscription.downloadLimit,

          used: subscription.downloadsUsed      }        }

        };

      }      });



      // Check if subscription is still valid      // Create Stripe subscription

      if (new Date() > subscription.currentPeriodEnd) {

        return { canDownload: false, reason: 'Subscription expired' };      const subscription = await stripe.subscriptions.create({      // Attach payment method to customer

      }

        customer: customer.id,      await this.stripe.paymentMethods.attach(paymentMethodId, {

      return { 

        canDownload: true,        items: [{        customer: customer.id,

        remaining: subscription.downloadLimit - subscription.downloadsUsed,

        limit: subscription.downloadLimit,          price: plan.priceId      });

        used: subscription.downloadsUsed

      };        }],

    } catch (error) {

      console.error('Error checking download eligibility:', error);        payment_behavior: 'default_incomplete',      // Set as default payment method

      throw new Error('Failed to check download eligibility');

    }        expand: ['latest_invoice.payment_intent'],      await this.stripe.customers.update(customer.id, {

  }

        metadata: {        invoice_settings: {

  // Record download usage

  static async recordDownload(userId, proposalId) {          userId: userId,          default_payment_method: paymentMethodId,

    try {

      const subscription = await this.getUserSubscription(userId);          planType: planType        },

      

      if (!subscription) {        }      });

        throw new Error('No active subscription');

      }      });



      // Create usage record        // Calculate amount with GST (10% - adjust as needed for your jurisdiction)

      await prisma.usageRecord.create({

        data: {      // Save subscription to database        const baseAmount = plan.price * 100; // Convert to cents

          userId: userId,

          subscriptionId: subscription.id,      const dbSubscription = await prisma.subscription.create({        const gstRate = 0.10; // 10% GST - adjust based on your tax requirements

          type: 'download',

          proposalId: proposalId,        data: {        const gstAmount = Math.round(baseAmount * gstRate);

          timestamp: new Date()

        }          userId: userId,        const totalAmount = baseAmount + gstAmount;      // Create subscription

      });

          stripeSubscriptionId: subscription.id,      const subscription = await this.stripe.subscriptions.create({

      // Update downloads used

      await prisma.subscription.update({          stripeCustomerId: customer.id,        customer: customer.id,

        where: { id: subscription.id },

        data: {          planType: planType,        items: [{

          downloadsUsed: {

            increment: 1          status: subscription.status,          price_data: {

          }

        }          currentPeriodStart: new Date(subscription.current_period_start * 1000),            currency: 'usd',

      });

          currentPeriodEnd: new Date(subscription.current_period_end * 1000),            product_data: {

      return true;

    } catch (error) {          downloadLimit: plan.downloadLimit,              name: `${planType} Plan`,

      console.error('Error recording download:', error);

      throw new Error('Failed to record download');          downloadsUsed: 0              description: plan.description,

    }

  }        }              metadata: {



  // Cancel subscription      });                proposals_limit: plan.proposalLimit.toString(),

  static async cancelSubscription(userId) {

    try {                downloads_limit: plan.downloadLimit.toString()

      const subscription = await this.getUserSubscription(userId);

            return {              }

      if (!subscription) {

        throw new Error('No active subscription found');        subscription: dbSubscription,            },

      }

        clientSecret: subscription.latest_invoice.payment_intent.client_secret            unit_amount: totalAmount,

      // Cancel in Stripe

      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {      };            recurring: {

        cancel_at_period_end: true

      });    } catch (error) {              interval: 'month'



      // Update in database      console.error('Error creating subscription:', error);            }

      await prisma.subscription.update({

        where: { id: subscription.id },      throw new Error('Failed to create subscription');          }

        data: {

          status: 'canceled'    }        }],

        }

      });  }        payment_behavior: 'default_incomplete',



      return true;        payment_settings: { save_default_payment_method: 'on_subscription' },

    } catch (error) {

      console.error('Error canceling subscription:', error);  // Get user subscription        expand: ['latest_invoice.payment_intent'],

      throw new Error('Failed to cancel subscription');

    }  static async getUserSubscription(userId) {        metadata: {

  }

    try {          companyId: companyId,

  // Get subscription usage analytics

  static async getUsageAnalytics(userId) {      const subscription = await prisma.subscription.findFirst({          planType: planType

    try {

      const subscription = await this.getUserSubscription(userId);        where: {        }

      

      if (!subscription) {          userId: userId,      });

        return null;

      }          status: {



      const usageRecords = await prisma.usageRecord.findMany({            in: ['active', 'trialing', 'past_due']      // Save subscription to database

        where: {

          userId: userId,          }      const currentPeriodStart = new Date(subscription.current_period_start * 1000);

          subscriptionId: subscription.id

        },        },      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

        orderBy: {

          timestamp: 'desc'        orderBy: {

        }

      });          createdAt: 'desc'      const dbSubscription = await prisma.subscription.create({



      return {        }        data: {

        subscription,

        usageRecords,      });          companyId: companyId,

        summary: {

          totalDownloads: subscription.downloadsUsed,          planType: planType,

          remainingDownloads: subscription.downloadLimit - subscription.downloadsUsed,

          downloadLimit: subscription.downloadLimit,      return subscription;          status: 'ACTIVE',

          planType: subscription.planType,

          status: subscription.status,    } catch (error) {          stripeSubscriptionId: subscription.id,

          currentPeriodEnd: subscription.currentPeriodEnd

        }      console.error('Error getting user subscription:', error);          stripeCustomerId: customer.id,

      };

    } catch (error) {      throw new Error('Failed to get subscription');          currentPeriodStart: currentPeriodStart,

      console.error('Error getting usage analytics:', error);

      throw new Error('Failed to get usage analytics');    }          currentPeriodEnd: currentPeriodEnd,

    }

  }  }          proposalLimit: plan.proposalLimit,

}

          downloadsUsed: 0,

module.exports = SubscriptionService;
  // Check if user can download          proposalsGenerated: 0,

  static async canUserDownload(userId) {          amount: BigInt(totalAmount),

    try {          currency: 'USD'

      const subscription = await this.getUserSubscription(userId);        }

            });

      if (!subscription) {

        return { canDownload: false, reason: 'No active subscription' };      return {

      }        subscription: dbSubscription,

        stripeSubscription: subscription,

      if (subscription.downloadsUsed >= subscription.downloadLimit) {        clientSecret: subscription.latest_invoice.payment_intent.client_secret

        return {       };

          canDownload: false, 

          reason: 'Download limit reached',    } catch (error) {

          limit: subscription.downloadLimit,      console.error('Error creating subscription:', error);

          used: subscription.downloadsUsed      throw error;

        };    }

      }  }



      // Check if subscription is still valid  // Check if user can generate proposal

      if (new Date() > subscription.currentPeriodEnd) {  async canGenerateProposal(companyId) {

        return { canDownload: false, reason: 'Subscription expired' };    try {

      }      if (!prisma) {

        // Mock response for development

      return {         return {

        canDownload: true,          canGenerate: true,

        remaining: subscription.downloadLimit - subscription.downloadsUsed,          used: 0,

        limit: subscription.downloadLimit,          limit: 5,

        used: subscription.downloadsUsed          remaining: 5

      };        };

    } catch (error) {      }

      console.error('Error checking download eligibility:', error);

      throw new Error('Failed to check download eligibility');      const subscription = await prisma.subscription.findFirst({

    }        where: {

  }          companyId: companyId,

          status: 'ACTIVE',

  // Record download usage          currentPeriodEnd: {

  static async recordDownload(userId, proposalId) {            gte: new Date()

    try {          }

      const subscription = await this.getUserSubscription(userId);        }

            });

      if (!subscription) {

        throw new Error('No active subscription');      if (!subscription) {

      }        return {

          canGenerate: false,

      // Create usage record          reason: 'No active subscription found. Please subscribe to generate AI proposals.',

      await prisma.usageRecord.create({          requiresSubscription: true

        data: {        };

          userId: userId,      }

          subscriptionId: subscription.id,

          type: 'download',      if (subscription.proposalsGenerated >= subscription.proposalLimit) {

          proposalId: proposalId,        return {

          timestamp: new Date()          canGenerate: false,

        }          reason: `Monthly proposal generation limit of ${subscription.proposalLimit} reached. Upgrade your plan for more proposals.`,

      });          used: subscription.proposalsGenerated,

          limit: subscription.proposalLimit,

      // Update downloads used          planType: subscription.planType

      await prisma.subscription.update({        };

        where: { id: subscription.id },      }

        data: {

          downloadsUsed: {      return {

            increment: 1        canGenerate: true,

          }        used: subscription.proposalsGenerated,

        }        limit: subscription.proposalLimit,

      });        remaining: subscription.proposalLimit - subscription.proposalsGenerated,

        planType: subscription.planType

      return true;      };

    } catch (error) {

      console.error('Error recording download:', error);    } catch (error) {

      throw new Error('Failed to record download');      console.error('Error checking proposal generation eligibility:', error);

    }      throw error;

  }    }

  }

  // Cancel subscription

  static async cancelSubscription(userId) {  // Check if user can download proposal

    try {  async canDownloadProposal(companyId) {

      const subscription = await this.getUserSubscription(userId);    try {

            if (!prisma) {

      if (!subscription) {        // Mock response for development

        throw new Error('No active subscription found');        return {

      }          canDownload: true,

          used: 0,

      // Cancel in Stripe          limit: 5,

      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {          remaining: 5

        cancel_at_period_end: true        };

      });      }



      // Update in database      const subscription = await prisma.subscription.findFirst({

      await prisma.subscription.update({        where: {

        where: { id: subscription.id },          companyId: companyId,

        data: {          status: 'ACTIVE',

          status: 'canceled'          currentPeriodEnd: {

        }            gte: new Date()

      });          }

        }

      return true;      });

    } catch (error) {

      console.error('Error canceling subscription:', error);      if (!subscription) {

      throw new Error('Failed to cancel subscription');        return {

    }          canDownload: false,

  }          reason: 'No active subscription found. Please subscribe to download proposals.',

          requiresSubscription: true

  // Handle webhook events        };

  static async handleWebhook(event) {      }

    try {

      switch (event.type) {      // Both BASE and PREMIUM plans use proposalLimit for downloads

        case 'invoice.payment_succeeded':      // BASE: 5 downloads, PREMIUM: 20 downloads

          await this.handlePaymentSucceeded(event.data.object);      if (subscription.downloadsUsed >= subscription.proposalLimit) {

          break;        return {

        case 'invoice.payment_failed':          canDownload: false,

          await this.handlePaymentFailed(event.data.object);          reason: `Monthly download limit of ${subscription.proposalLimit} reached. Upgrade your plan for more downloads.`,

          break;          used: subscription.downloadsUsed,

        case 'customer.subscription.deleted':          limit: subscription.proposalLimit,

          await this.handleSubscriptionDeleted(event.data.object);          planType: subscription.planType

          break;        };

        case 'customer.subscription.updated':      }

          await this.handleSubscriptionUpdated(event.data.object);

          break;      return {

        default:        canDownload: true,

          console.log(`Unhandled event type: ${event.type}`);        used: subscription.downloadsUsed,

      }        limit: subscription.proposalLimit,

    } catch (error) {        remaining: subscription.proposalLimit - subscription.downloadsUsed,

      console.error('Error handling webhook:', error);        planType: subscription.planType

      throw error;      };

    }

  }    } catch (error) {

      console.error('Error checking download eligibility:', error);

  static async handlePaymentSucceeded(invoice) {      throw error;

    try {    }

      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);  }

      

      await prisma.subscription.updateMany({  // Record proposal generation

        where: { stripeSubscriptionId: subscription.id },  async recordProposalGeneration(companyId, proposalId) {

        data: {    try {

          status: 'active',      if (!prisma) {

          currentPeriodStart: new Date(subscription.current_period_start * 1000),        console.log(`📊 Mock: Recorded proposal generation for company ${companyId}, proposal ${proposalId}`);

          currentPeriodEnd: new Date(subscription.current_period_end * 1000),        return true;

          // Reset downloads for new billing period      }

          downloadsUsed: 0

        }      const subscription = await prisma.subscription.findFirst({

      });        where: {

    } catch (error) {          companyId: companyId,

      console.error('Error handling payment succeeded:', error);          status: 'ACTIVE'

    }        }

  }      });



  static async handlePaymentFailed(invoice) {      if (!subscription) {

    try {        throw new Error('No active subscription found');

      await prisma.subscription.updateMany({      }

        where: { stripeSubscriptionId: invoice.subscription },

        data: { status: 'past_due' }      // Update subscription usage

      });      await prisma.subscription.update({

    } catch (error) {        where: { id: subscription.id },

      console.error('Error handling payment failed:', error);        data: {

    }          proposalsGenerated: {

  }            increment: 1

          }

  static async handleSubscriptionDeleted(subscription) {        }

    try {      });

      await prisma.subscription.updateMany({

        where: { stripeSubscriptionId: subscription.id },      // Create usage record

        data: { status: 'canceled' }      await prisma.usageRecord.create({

      });        data: {

    } catch (error) {          companyId: companyId,

      console.error('Error handling subscription deleted:', error);          subscriptionId: subscription.id,

    }          type: 'PROPOSAL_GENERATION',

  }          proposalId: proposalId,

          description: 'AI proposal generated'

  static async handleSubscriptionUpdated(subscription) {        }

    try {      });

      await prisma.subscription.updateMany({

        where: { stripeSubscriptionId: subscription.id },      return true;

        data: {    } catch (error) {

          status: subscription.status,      console.error('Error recording proposal generation:', error);

          currentPeriodStart: new Date(subscription.current_period_start * 1000),      throw error;

          currentPeriodEnd: new Date(subscription.current_period_end * 1000)    }

        }  }

      });

    } catch (error) {  // Record proposal download

      console.error('Error handling subscription updated:', error);  async recordProposalDownload(companyId, proposalId) {

    }    try {

  }      const subscription = await prisma.subscription.findFirst({

        where: {

  // Get subscription usage analytics          companyId: companyId,

  static async getUsageAnalytics(userId) {          status: 'ACTIVE'

    try {        }

      const subscription = await this.getUserSubscription(userId);      });

      

      if (!subscription) {      if (!subscription) {

        return null;        throw new Error('No active subscription found');

      }      }



      const usageRecords = await prisma.usageRecord.findMany({      // Update subscription usage

        where: {      await prisma.subscription.update({

          userId: userId,        where: { id: subscription.id },

          subscriptionId: subscription.id        data: {

        },          downloadsUsed: {

        orderBy: {            increment: 1

          timestamp: 'desc'          }

        }        }

      });      });



      return {      // Update proposal download timestamp

        subscription,      await prisma.proposal.update({

        usageRecords,        where: { id: proposalId },

        summary: {        data: {

          totalDownloads: subscription.downloadsUsed,          downloadedAt: new Date()

          remainingDownloads: subscription.downloadLimit - subscription.downloadsUsed,        }

          downloadLimit: subscription.downloadLimit,      });

          planType: subscription.planType,

          status: subscription.status,      // Create usage record

          currentPeriodEnd: subscription.currentPeriodEnd      await prisma.usageRecord.create({

        }        data: {

      };          companyId: companyId,

    } catch (error) {          subscriptionId: subscription.id,

      console.error('Error getting usage analytics:', error);          type: 'PROPOSAL_DOWNLOAD',

      throw new Error('Failed to get usage analytics');          proposalId: proposalId,

    }          description: 'Proposal downloaded'

  }        }

}      });



module.exports = SubscriptionService;      return true;
    } catch (error) {
      console.error('Error recording proposal download:', error);
      throw error;
    }
  }

  // Get subscription details
  async getSubscriptionDetails(companyId) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          companyId: companyId,
          status: 'ACTIVE'
        },
        include: {
          usageRecords: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      if (!subscription) {
        return null;
      }

      return {
        planType: subscription.planType,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        proposalLimit: subscription.proposalLimit,
        proposalsGenerated: subscription.proposalsGenerated,
        downloadsUsed: subscription.downloadsUsed,
        remainingProposals: subscription.proposalLimit - subscription.proposalsGenerated,
        remainingDownloads: subscription.proposalLimit - subscription.downloadsUsed,
        recentUsage: subscription.usageRecords
      };

    } catch (error) {
      console.error('Error getting subscription details:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(companyId) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          companyId: companyId,
          status: 'ACTIVE'
        }
      });

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      // Cancel with Stripe
      if (subscription.stripeSubscriptionId) {
        await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      }

      // Update in database
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED'
        }
      });

      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Handle Stripe webhook for subscription events
  async handleSubscriptionWebhook(event) {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handleSuccessfulPayment(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handleFailedPayment(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object);
          break;
      }
    } catch (error) {
      console.error('Error handling subscription webhook:', error);
      throw error;
    }
  }

  async handleSuccessfulPayment(invoice) {
    const subscriptionId = invoice.subscription;
    
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: { status: 'ACTIVE' }
    });
  }

  async handleFailedPayment(invoice) {
    const subscriptionId = invoice.subscription;
    
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: { status: 'PAST_DUE' }
    });
  }

  async handleSubscriptionCancellation(subscription) {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: 'CANCELLED' }
    });
  }

  async handleSubscriptionUpdate(subscription) {
    const currentPeriodStart = new Date(subscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        currentPeriodStart,
        currentPeriodEnd,
        status: subscription.status.toUpperCase()
      }
    });
  }
}

module.exports = new SubscriptionService();
