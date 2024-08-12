import { MongoClient, Db, Filter, Document, ObjectId } from 'mongodb';

export interface UserDbModel {
    _id?: ObjectId;
    email: string;
    access_token: string;
    refresh_token: string;
    carsVins: string[];
    siteId: string;
    serviceEnabled: boolean;
}

export class Database {
    private uri: string;
    private dbName: string;
    private client: MongoClient;
    private db: Db;

    public constructor(uri: string, dbName: string) {
        this.uri = uri;
        this.dbName = dbName;
        this.client = new MongoClient(uri);
        this.connectAndCheckDatabase();
        this.db = this.client.db(this.dbName);
    }

    private async connectAndCheckDatabase(): Promise<void> {
        try {
            await this.client.connect();
            const adminDb = this.client.db().admin();
            const databases = await adminDb.listDatabases();

            const dbExists = databases.databases.some((db: { name: string }) => db.name === this.dbName);

            if (!dbExists) {
                await this.db.createCollection('user'); // Creating an initial collection to create the DB
                console.log(`Database ${this.dbName} created.`);
            } else {
                console.log(`Database ${this.dbName} already exists.`);
            }
        } catch (error) {
            console.error('Error connecting or checking the database:', error);
        }
    }

    public getDb(): Db {
        return this.db;
    }

    public async closeConnection(): Promise<void> {
        await this.client.close();
    }

    public async findUser(request: Filter<Document>): Promise<UserDbModel | null> {
        const userCollection = this.db.collection('user');
        const record = await userCollection.findOne<UserDbModel>(request);
        console.log("Found: ", record);
        return record;
    }

    public async getAllUsers(): Promise<UserDbModel[]> {
        const userCollection = this.db.collection('user');
        const users = await userCollection.find().toArray();
        return users as any[];
    }

    public async createUser(user: UserDbModel): Promise<void> {
        const userCol = this.db.collection('user');
        await userCol.insertOne(user);
    }

    // todo: use id instead of email
    public async updateAccessToken(user: string, token: string): Promise<void> {
        const userCol = this.db.collection('user');
        await userCol.updateOne({ email: user }, { $set: { access_token: token } });
    }
}

export function makeDatabaseInstance() {
    return new Database('mongodb://localhost:27017', 'sunsip');
}

export default Database;