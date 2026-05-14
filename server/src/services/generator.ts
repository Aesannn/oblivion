import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '../types';

export class TransactionGenerator {
  private io: Server;
  private tps: number = 32;
  private interval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  private countries = ['US', 'GB', 'DE', 'FR', 'JP', 'CN', 'BR', 'NG', 'AE', 'SG'];
  private currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AED'];
  private categories = ['retail', 'travel', 'gaming', 'food', 'electronics', 'crypto', 'luxury'];
  private paymentMethods = ['credit_card', 'bank_transfer', 'apple_pay', 'crypto_wallet', 'paypal'];

  constructor(io: Server) {
    this.io = io;
  }

  public setTPS(tps: number) {
    this.tps = tps;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  public start() {
    this.isRunning = true;
    const intervalMs = 1000 / this.tps;
    
    this.interval = setInterval(() => {
      const transaction = this.generateTransaction();
      this.io.emit('transaction', transaction);
    }, intervalMs);
    
    console.log(`Transaction Generator started at ${this.tps} TPS`);
  }

  public stop() {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private generateTransaction(): Transaction {
    const country = this.countries[Math.floor(Math.random() * this.countries.length)];
    const amount = Math.random() * 5000 + 10;
    
    // Simulate periodic fraud bursts
    const isAnomaly = Math.random() < 0.05;
    const riskSeed = isAnomaly ? 0.7 + Math.random() * 0.3 : Math.random() * 0.4;

    return {
      transaction_id: uuidv4() || uuidv4(),
      timestamp: Date.now(),
      user_id: `user_${Math.floor(Math.random() * 10000)}`,
      merchant_id: `merch_${Math.floor(Math.random() * 1000)}`,
      amount: parseFloat(amount.toFixed(2)),
      currency: this.currencies[Math.floor(Math.random() * this.currencies.length)],
      geo_location: {
        lat: (Math.random() * 180) - 90,
        lng: (Math.random() * 360) - 180,
        country: country
      },
      device_id: `dev_${uuidv4().split('-')[0]}`,
      payment_method: this.paymentMethods[Math.floor(Math.random() * this.paymentMethods.length)],
      risk_seed_score: riskSeed,
      category: this.categories[Math.floor(Math.random() * this.categories.length)]
    };
  }
}
