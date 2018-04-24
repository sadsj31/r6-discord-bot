import SimpleLeaderboard from './SimpleLeaderboard';
import db from '../db';
import { Players } from '../player';

class Leaderboards {
  constructor() {
    this.db = db.leaderboards;
    this.leaderboards = {
      kills: new SimpleLeaderboard(this, {
        name: 'All-Time Kills',
        key: 'kills',
        keyName: 'Kills',
        description: 'Showing top murderers from top to bottom',
      }),
      deaths: new SimpleLeaderboard(this, {
        name: 'All-Time Deaths',
        key: 'deaths',
        keyName: 'Deaths',
        description: 'Showing top deaths from top to bottom',
      }),
      kd: new SimpleLeaderboard(this, {
        name: 'All-Time K/D Ratio',
        key: 'kd',
        keyName: 'K/D Ratio',
        description: 'Showing top K/D ratios from all tracked players',
      }),
    };
  }

  getLeaderboard = (id) => {
    if (!this.leaderboards[id]) {
      throw new Error('Leaderboard does not exist');
    }

    return this.leaderboards[id];
  }

  async getTrackedPlayers(serverId) {
    return new Promise((resolve, reject) => {
      try {
        this.db.findOne({ _id: serverId }, (err, lb) => {
          if (!lb) {
            return resolve([]);
          }

          return resolve(lb.trackedPlayers);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async addTrackedPlayer(serverId, playerName) {
    const player = await Players.getPlayer(playerName);

    if (!player) {
      return false;
    }

    await this.db.findOne({ _id: serverId }, (err, lb) => {
      if (!lb) {
        this.db.insert({ _id: serverId, trackedPlayers: [playerName] }, () => true);
      } else {
        this.db.update(
          { _id: serverId },
          { $addToSet: { trackedPlayers: playerName } },
          () => true,
        );
      }
    });

    return true;
  }

  async removeTrackedPlayer(serverId, playerName) {
    await this.db.findOne({ _id: serverId }, (err, lb) => {
      if (lb && lb.trackedPlayers.includes(playerName)) {
        this.db.update(
          { _id: serverId },
          { $pull: { trackedPlayers: playerName } },
          () => true,
        );
      }
    });
  }
}

const leaderboards = new Leaderboards();

export default leaderboards;
