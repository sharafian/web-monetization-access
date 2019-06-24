export interface TokenEntry {
  total: number
  rate: number
  packets: Array<DatedPacket>
  metadata: object
}

export interface DatedPacket {
  date: number
  amount: number
}

export interface TokenEntryMap {
  [key: string]: TokenEntry
}

// we determine the streaming rate based on the last 10 seconds 
const WINDOW_SIZE: number = 10000

export class MemoryStore {
  private entries: TokenEntryMap = {}

  private entry (key: string) {
    const entry = this.entries[key]
    if (entry) {
      return entry
    } else {
      const newEntry = {
        total: 0,
        rate: 0,
        packets: [],
        // TODO: init with metadata?
        metadata: {}
      }

      this.entries[key] = newEntry
      return newEntry
    }
  }

  private setRate (key: string) {
    const entry = this.entry(key)
    const now = Date.now()

    while (entry.packets[0] && entry.packets[0].date + WINDOW_SIZE < now) {
      entry.packets.shift()
    }

    const windowSize = now - entry.packets[0].date
    const windowSum = entry.packets.reduce((agg: number, packet: DatedPacket) => {
      return agg + packet.amount 
    }, 0)

    entry.rate = windowSum / windowSize
  }

  add (key: string, amount: number) {
    const entry = this.entry(key)

    entry.total += amount
    entry.packets.push({
      date: Date.now(),
      amount
    })

    this.setRate(key)
  }

  get (key: string) {
    this.setRate(key)
    const entry = this.entry(key)

    return {
      total: entry.total,
      rate: entry.rate,
      metadata: entry.metadata
    }
  }
}
