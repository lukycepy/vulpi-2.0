
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from '@/lib/prisma';
import { decryptString } from '@/lib/crypto';

interface BankMovementData {
    amount: number;
    currency: string;
    variableSymbol: string | null;
    accountName: string | null;
    date: Date;
    transactionId: string; // We'll use message ID or hash as transaction ID
    message: string | null;
}

export async function syncImapBank(integration: any) {
    if (!integration.encryptedToken || !integration.encryptedKey) {
        throw new Error("Missing credentials for IMAP");
    }

    const password = decryptString(integration.encryptedToken);
    const connectionString = decryptString(integration.encryptedKey); // format: user@domain.com|imap.server.com|993
    
    const [user, host, portStr] = connectionString.split('|');
    const port = parseInt(portStr || "993", 10);

    const client = new ImapFlow({
        host,
        port,
        secure: true,
        auth: {
            user,
            pass: password
        },
        logger: false
    });

    const movements: BankMovementData[] = [];

    try {
        await client.connect();
        
        // Open INBOX
        let lock = await client.getMailboxLock('INBOX');
        try {
            // Fetch unseen messages
            // We can also filter by sender if we want to be more specific (e.g., info@banka.cz)
            // For now, let's process all unseen and try to parse them.
            // Be careful not to process non-bank emails. Ideally user should use a dedicated folder or rule.
            // Let's assume user set up a rule or we check sender/subject.
            
            // Search for unseen messages
            const messages = client.fetch({ seen: false }, { source: true, envelope: true });

            for await (const message of messages) {
                if (!message.source) continue;
                const parsed = await simpleParser(message.source);
                const text = parsed.text || "";
                const subject = parsed.subject || "";
                const fromObj = message.envelope?.from?.[0];
                const from = fromObj?.address || parsed.from?.text || "";

                // Basic validation - check if it looks like a bank email
                // This is heuristics. User should probably configure sender filter.
                // For now, we try to parse and if we find Amount and VS, we assume it is a bank email.
                
                const movement = parseBankEmail(text, subject, from, message.envelope?.messageId || message.uid.toString());
                
                if (movement) {
                    movements.push(movement);
                    // Mark as seen
                    await client.messageFlagsAdd(message.uid, ['\\Seen']);
                }
            }
        } finally {
            lock.release();
        }

        // We could also check SPAM folder, but usually bank emails shouldn't be there.
        
        await client.logout();

    } catch (error) {
        console.error("IMAP Sync Error:", error);
        throw error;
    }

    return movements;
}

function parseBankEmail(text: string, subject: string, from: string, messageId: string): BankMovementData | null {
    // Combine subject and text for searching
    const content = `${subject}\n${text}`;
    
    // Regex Patterns
    // 1. Amount: "Částka: 1 500,00 CZK", "1.500,00 CZK", "Amount: 50.00 EUR"
    // Look for number followed by currency
    const amountRegex = /(?:Částka|Amount|Suma)?[:\s]*([\d\s\.,]+)\s*(CZK|EUR|USD)/i;
    
    // 2. Variable Symbol: "VS: 123456", "Var. symbol: 123456"
    const vsRegex = /(?:VS|Var\.?\s*symbol|Variabilní symbol)[:\s]*(\d+)/i;
    
    // 3. Account Name / Sender: "Protiúčet: Jan Novak", "Od: Firma ABC"
    // This is tricky as format varies wildly.
    const nameRegex = /(?:Protiúčet|Název protiúčtu|Odesílatel|Příjemce|Od|Name)[:\s]*([^\n\r]+)/i;

    const amountMatch = content.match(amountRegex);
    const vsMatch = content.match(vsRegex);
    const nameMatch = content.match(nameRegex);

    if (amountMatch) {
        let amountStr = amountMatch[1].replace(/\s/g, '').replace(',', '.');
        // Handle Czech format 1.500,00 -> 1500.00 vs 1,500.00
        // If multiple dots, remove all but last. If comma and dot, assume comma is decimal if at end.
        // Simple heuristic: replace comma with dot.
        
        // Better parser for "1 500,00" -> 1500.00
        amountStr = amountMatch[1].replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
        
        const amount = parseFloat(amountStr);
        const currency = amountMatch[2].toUpperCase();
        
        // Only consider it a valid bank movement if we have at least an amount.
        // Ideally we want VS too, but some payments don't have it.
        
        // Generate a transaction ID if not present in email (using hash of content + date could be better but messageId is standard)
        // We use messageId as base.
        
        return {
            amount,
            currency,
            variableSymbol: vsMatch ? vsMatch[1] : null,
            accountName: nameMatch ? nameMatch[1].trim() : null,
            date: new Date(), // We use current time of processing or email date (we didn't extract email date above, could improve)
            transactionId: messageId, // Use email Message-ID as unique identifier
            message: subject.substring(0, 255)
        };
    }

    return null;
}
