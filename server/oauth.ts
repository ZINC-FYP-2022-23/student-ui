import crypto from "crypto";
import redis from "redis";
import axios from "axios";
import { auth, ConfigParams } from "express-openid-connect";
import { getUserData } from "../utils/user";

const SESSION_VALID_FOR = 8 * 60 * 60 * 1000;
const client = redis.createClient(parseInt(process.env.REDIS_PORT!, 10),process.env.REDIS_HOST);

const config: ConfigParams = {
  issuerBaseURL: process.env.CAS_AUTH_BASE_URL,
  baseURL: `https://${process.env.HOSTNAME}`,
  clientID: process.env.CAS_AUTH_USER_CLIENT_ID,
  clientSecret: process.env.CAS_AUTH_USER_CLIENT_SECRET,
  secret: process.env.SESSION_SECRET,
  authorizationParams:{
    response_type: 'code',
    scope: 'openid profile email'
  },
  idpLogout: false,
  session:{
    genid: () => crypto.randomBytes(16).toString('hex'),
    store: {
      get: (sid, callback) => {
        const key = crypto.createHmac('sha1', process.env.SESSION_SECRET!).update(sid).digest().toString('base64');
        client.get(key, (err, data)=>{
          if(err) return callback(err)
          if(!data) return callback(null)

          let result
          try{
            result = JSON.parse(data);
          }catch(err){
            return callback(err)
          }
          return callback(null, result)
        });
      },
      set: (sid, data, callback) => {
        const key = crypto.createHmac('sha1', process.env.SESSION_SECRET!).update(sid).digest().toString('base64');
        client.set(key, JSON.stringify(data),'EX', 86400, callback)
        // client.expire(key, 86400)
      },
      destroy: (sid,callback) => {
        const key = crypto.createHmac('sha1', process.env.SESSION_SECRET!).update(sid).digest().toString('base64');
        client.del(key, callback)
      },
    },
    absoluteDuration: SESSION_VALID_FOR,
    cookie: {
      domain: process.env.HOSTNAME,
      secure: true,
    }
  },
  afterCallback: async (req, res, session) => {
    try {
      const additionalUserClaims = await axios(process.env.CAS_AUTH_BASE_URL+'/profile', {
        headers:{
          Authorization: 'Bearer ' + session.access_token
        }
      });
      // @ts-ignore
      req.appSession!.openidTokens = session.access_token;
      // @ts-ignore
      req.appSession!.userIdentity = additionalUserClaims.data;
      const { sub, name } = additionalUserClaims.data;
      // notification
      const { userId, semesterId} = await getUserData(sub, name!);
      // const userId = '20605387'
      // const semesterId = 'testing2213'
      // user table + col --> notification token
      // set cookie --> null not set --> non null set
      res.cookie('semester', semesterId, { maxAge: SESSION_VALID_FOR, httpOnly: false, domain: `.${process.env.HOSTNAME}` });
      res.cookie('user', userId, { maxAge: SESSION_VALID_FOR, httpOnly: false, domain: `.${process.env.HOSTNAME}` });
      res.cookie(
        'client',
        process.env.CAS_AUTH_CONSOLE_CLIENT_ID,
        { maxAge: SESSION_VALID_FOR, httpOnly: true, domain: `.${process.env.HOSTNAME}` });
    } catch (error) {
      throw error
    }
    return {
      ...session,
    };
  }
}

export default auth(config);