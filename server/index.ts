import express, { Express, Request, Response } from 'express'
import { API } from './api'
import http from 'http'
import { resolve, dirname } from 'path'
import { Database } from './database'
import { manageUser } from './class/user'
import { manageTweet } from './class/tweets'
import { authenticateToken } from './middleware/authMiddleware'

class Backend {
  // Properties
  private _app: Express
  private _api: API
  private _database: Database
  private _env: string
  private manageUser: manageUser
  private manageTweet: manageTweet

  // Getters
  public get app(): Express {
    return this._app
  }

  public get api(): API {
    return this._api
  }

  public get database(): Database {
    return this._database
  }

  // Constructor
  constructor() {
    this._app = express()
    this._app.use(express.json()) // Middleware allows the app Express to parse JSON data
    // https://www.geeksforgeeks.org/express-js-express-urlencoded-function/
    this._app.use(express.urlencoded({ extended: true })); // Middleware allows the app Express to parse URL-encoded data
    this._database = new Database()
    this.manageUser = new manageUser(this._database)
    this.manageTweet = new manageTweet(this._database)
    this._api = new API(this._app, this.manageUser, this.manageTweet)
    this._env = process.env.NODE_ENV || 'development'

    this.setupStaticFiles()
    this.setupRoutes()
    this.startServer()
  }

  // Methods
  private setupStaticFiles(): void {
    this._app.use(express.static('client'))
  }

  private setupRoutes(): void {
    this._app.get('/', authenticateToken, (req: Request, res: Response) => {
        const __dirname = resolve(dirname(''));
        res.sendFile(__dirname + '/client/index.html');
    });

    this._app.post('/tweets', authenticateToken, (req: Request, res: Response) => {
      this.manageTweet.createTweet(req, res);
    });

    this._app.get('/tweets', authenticateToken, (req: Request, res: Response) => {
      this.manageTweet.seeTweets(req, res);
    })

    this._app.delete('/tweets', authenticateToken, (req: Request, res: Response) => {
      this.manageTweet.deleteTweets(req, res);
    })

    this._app.put('/tweets', authenticateToken, (req: Request, res: Response) => {
      this.manageTweet.editTweets(req, res);
    })

    this._app.get('/register', (req: Request, res: Response) => {
        const __dirname = resolve(dirname(''));
        res.sendFile(__dirname + '/client/register.html');
    });

    this._app.post('/register', (req: Request, res: Response) => {
        this.manageUser.register(req, res);
    });

    this.app.post('/login', (req: Request, res: Response) => {
      this.manageUser.login(req, res);
    })

    this._app.get('/login', (req: Request, res: Response) => {
        const __dirname = resolve(dirname(''));
        res.sendFile(__dirname + '/client/login.html');
    });

    this._app.get('/changeUsername', (req: Request, res: Response) => {
        const __dirname = resolve(dirname(''));
        res.sendFile(__dirname + '/client/changeUsername.html');
    })

    this._app.post('/changeUsername', (req: Request, res: Response) => {
      this.manageUser.changeUsername(req, res);
    })

    this._app.get('/myTweets', authenticateToken, (req: Request, res: Response) => {
      this.manageTweet.seeMyTweets(req, res);
    });    

    this._app.get('/changePassword', (req: Request, res: Response) => {
      const __dirname = resolve(dirname(''));
      res.sendFile(__dirname + '/client/changePassword.html');
    })
  
    this._app.post('/changePassword', (req: Request, res: Response) => {
      this.manageUser.changePassword(req, res);
    })  
    
    this._app.post('/tweets/like', authenticateToken, (req: Request, res: Response) => {
      this.manageTweet.addLike(req, res);
    });

    this._app.get('/tweets/:post_id/likes', authenticateToken, (req: Request, res: Response) => {
      this.manageTweet.seeLiksAndDislikes(req, res);
    }); 
}

  private startServer(): void {
    if (this._env === 'production') {
      http.createServer(this.app).listen(3000, () => {
        console.log('Server is listening!')
      })
    }
  }
}

const backend = new Backend()
export const viteNodeApp = backend.app
