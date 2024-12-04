import { Database } from '../database';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
process.env.TOKEN_SECRET;

export interface ITweet {
  id: number;
  userId: string;
  content: string;
  likes?: number;
  dislikes?: number;
}

export class Tweet {
  public content: string;
  public user: string;

  constructor(content: string, user: string) {
    this.content = content;
    this.user = user;
  }
}

export class manageTweet {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  createTweet = async (req: Request, res: Response) => {
    try {
        const { content } = req.body as ITweet;
        const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

        if (!content || !token) {
            return res.status(400).json({ error: '⚠️ Content and token are required.' });
        }

        // Verify token and decode the username
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        const username = decoded.username;

        // Find the user_id using the username
        const userQuery = `SELECT id FROM users WHERE username = '${username}'`;
        const userResult: any = await this.db.executeSQL(userQuery);

        const userId = userResult[0].id;

        const tweetQuery = `INSERT INTO tweets (user_id, content) VALUES (${userId}, '${content}')`;
        const tweetResult: any = await this.db.executeSQL(tweetQuery);

        const tweetId = tweetResult.insertId; // Get the tweet_id from the result

        const likesQuery = `INSERT INTO likes (post_id, user_id, isPositive) VALUES (${tweetId}, ${userId}, null)`;
        await this.db.executeSQL(likesQuery);

        res.status(201).json({ message: '👍 Tweet creado correctamente.', tweetId });
    } catch (error) {
        console.error('👎 Error creando tweet:', error);
        res.status(500).json({ error: 'Error creando tweet.' });
    }
  };
  
  seeTweets = async (req: any, res: Response) => {
    try {
      const username = req.user.username; /// To get the username
      // console.log(username);
      const query = `SELECT tweets.id, tweets.content, users.username,(SELECT COUNT(*) FROM likes WHERE post_id = tweets.id AND isPositive = true) AS likes,(SELECT COUNT(*) FROM likes WHERE post_id = tweets.id AND isPositive = false) AS dislikes FROM tweets INNER JOIN users ON tweets.user_id = users.id;
`;

      const tweets = await this.db.executeSQL(query);

      // console.log(tweets);

      res.status(200).json({ username, tweets }); // To save the tweets and username in JSON
    } catch (error) {
      console.error('Error loading tweets:', error);
      res.status(500).json({ error: 'Error loading tweets.' });
    }
  };  

  deleteTweets = async (req: Request, res: Response) => {
    try {
        const { tweetID } = req.body;
        const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

        if (!tweetID || !token) {
            return res.status(400).json({ error: '⚠️ TweetID and token are required.' });
        }

        // Verify token and decode the username
        const decoded: any = jwt.verify(token, process.env.TOKEN_SECRET);
        const username = decoded.username;

        // Find the user_id using the username
        const userQuery = `SELECT id FROM users WHERE username = '${username}'`;
        const userResult: any = await this.db.executeSQL(userQuery);

        const userId = userResult[0].id; // Get the user_id from the result

        const deleteLikesQuery = `DELETE FROM likes WHERE post_id = ${tweetID}`;
        await this.db.executeSQL(deleteLikesQuery);

        const deleteTweetQuery = `DELETE FROM tweets WHERE id = ${tweetID} AND user_id = ${userId}`;
        await this.db.executeSQL(deleteTweetQuery);

        res.status(200).json({ message: '👍 Tweet eliminado correctamente.' });
    } catch (error) {
        console.error('👎 Error eliminando el tweet:', error);
        res.status(500).json({ error: 'Error eliminando el tweet.' });
    }
  };

  editTweets = async (req: any, res: Response) => {
    try {
      const { tweetID, newContent } = req.body; // Get the tweetID and newContent (the new content that we will edit) from the request body
      // console.log(req.body);
      const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
  
      if (!tweetID || !newContent || !token) {
        return res.status(400).json({ error: '⚠️ TweetID, newContent and token are required.' });
      }
  
      // Verify and decode the jwt token
      const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
      const username = decoded.username; // Get the username from the decod token
  
      // Find the user_id using the username
      const userQuery = `SELECT id FROM users WHERE username = '${username}'`;
      const userResult: any = await this.db.executeSQL(userQuery);
  
      const userId = userResult[0].id; // Get the user_id from the result
  
      // Verify that the tweet is from the user
      const tweetQuery = `SELECT * FROM tweets WHERE id = ${tweetID} AND user_id = ${userId}`;
      const tweetResult: any = await this.db.executeSQL(tweetQuery);
  
      if (tweetResult.length === 0) {
        return res.status(403).json({ error: 'You can only edit your own tweets.' });
      }
  
      // Update the tweet content
      const updateQuery = `UPDATE tweets SET content = '${newContent}' WHERE id = ${tweetID}`;
      await this.db.executeSQL(updateQuery);
  
      res.status(201).json({ message: '👍 Tweet updated successfully.' });
    } catch (error) {
      console.error('👎 Error editing tweet:', error);
      res.status(500).json({ error: 'Error editing tweet.' });
    }
  };  

  seeMyTweets = async (req: any, res: Response) => {
    try {
      const username = req.user.username;

      const query = `SELECT tweets.id, users.username, tweets.content FROM tweets INNER JOIN users ON tweets.user_id = users.id WHERE users.username = '${username}'`; // Filter to the authentificate username
      const tweets = await this.db.executeSQL(query);

      res.status(200).json({ tweets, username });
    } catch (error) {
      console.error('Error loading user tweets:', error);
      res.status(500).json({ error: 'Error loading user tweets.' });
    }
  };

  addLike = async (req: Request, res: Response) => {
    try {
        const { post_id, isPositive } = req.body;
        const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

        if (!post_id || isPositive === undefined || !token) {
            return res.status(400).json({ error: '⚠️ Post ID, like/dislike, and token required.' });
        }

        // Verify token and decode the username
        const decoded: any = jwt.verify(token, process.env.TOKEN_SECRET);
        const username = decoded.username;

        // Find the user_id using the username
        const userQuery = `SELECT id FROM users WHERE username = '${username}'`;
        const userResult: any = await this.db.executeSQL(userQuery);
        const userId = userResult[0]?.id;

        if (!userId) {
            return res.status(400).json({ error: 'User not found.' });
        }

        // Verify if the tweet exists and get its ID
        const tweetQuery = `SELECT id FROM tweets WHERE id = ${post_id}`;
        const tweetResult: any = await this.db.executeSQL(tweetQuery);

        if (tweetResult.length === 0) {
            return res.status(404).json({ error: 'Tweet not found.' });
        }

        const query = `INSERT INTO likes (post_id, user_id, isPositive) VALUES (${post_id}, ${userId}, ${isPositive})ON DUPLICATE KEY UPDATE isPositive = ${isPositive};`;
        await this.db.executeSQL(query);

        res.status(201).json({ message: `👍 Like/Dislike registrado correctamente.` });
    } catch (error) {
        console.error('👎 Error registering like/dislike:', error);
        res.status(500).json({ error: 'Error registering like/dislike.' });
    }
  };

  seeLiksAndDislikes = async (req: Request, res: Response) => {
    try {
        const { post_id } = req.params;

        if (!post_id) {
            return res.status(400).json({ error: '⚠️ Post ID is required.' });
        }

        const query = `SELECT SUM(CASE WHEN isPositive = true THEN 1 ELSE 0 END) AS likes, SUM(CASE WHEN isPositive = false THEN 1 ELSE 0 END) AS dislikesFROM likes WHERE post_id = ${post_id};`;
        const result: any = await this.db.executeSQL(query);

        res.status(200).json({ likes: result[0]?.likes || 0, dislikes: result[0]?.dislikes || 0 });
    } catch (error) {
        console.error('👎 Error getting likes/dislikes:', error);
        res.status(500).json({ error: 'Error getting likes/dislikes.' });
    }
  };
}