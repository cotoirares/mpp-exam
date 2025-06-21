import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

export interface Candidate {
  id: number;
  name: string;
  image: string;
  politicalParty: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CandidateStats {
  party: string;
  count: number;
}

export interface CandidateCreateInput {
  name: string;
  politicalParty: string;
  description: string;
}

export interface CandidateUpdateInput {
  id: number;
  name: string;
  politicalParty: string;
  description: string;
}

// Global state for persistence across hot reloads
let globalCandidates: Candidate[] | null = null;
let globalNextId: number = 1;
let globalEventEmitter: EventEmitter | null = null;

class CandidateService extends EventEmitter {
  private candidates: Candidate[] = [];
  private nextId = 1;

  constructor() {
    super();
    console.log('🏗️ [CandidateService] Initializing candidate service...');
    
    // Use global state if available (from previous hot reload)
    if (globalCandidates !== null) {
      console.log('♻️ [CandidateService] Restoring from global state:', globalCandidates.length, 'candidates');
      this.candidates = globalCandidates;
      this.nextId = globalNextId;
    } else {
      console.log('🆕 [CandidateService] First initialization - creating default candidates');
      this.initializeDefaultCandidates();
      globalCandidates = this.candidates;
      globalNextId = this.nextId;
    }
    
    // Store reference to this emitter globally
    globalEventEmitter = this;
    
    console.log('✅ [CandidateService] Service initialized with', this.candidates.length, 'candidates');
  }

  private initializeDefaultCandidates() {
    const defaultCandidates: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: "Nicușor Dan",
        image: "https://ui-avatars.com/api/?name=Nicusor+Dan&size=400&background=f59e0b&color=fff&bold=true",
        politicalParty: "USR (Save Romania Union)",
        description: "Current Mayor of Bucharest and prominent civic activist. Mathematical background with a PhD from École Normale Supérieure. Known for his anti-corruption stance and urban development initiatives. Founded the Save Bucharest Association and has been instrumental in protecting Bucharest's historical heritage while modernizing city infrastructure."
      },
      {
        name: "Ilie Bolojan",
        image: "https://ui-avatars.com/api/?name=Ilie+Bolojan&size=400&background=1d4ed8&color=fff&bold=true",
        politicalParty: "PNL (National Liberal Party)",
        description: "Mayor of Oradea since 2011 and one of Romania's most respected local administrators. Known for transforming Oradea into a model European city through efficient governance, transparency, and major infrastructure projects. His administration is recognized for digitalization, urban development, and citizen-oriented services. Often cited as a potential presidential candidate."
      },
      {
        name: "Marcel Ciolacu",
        image: "https://ui-avatars.com/api/?name=Marcel+Ciolacu&size=400&background=dc2626&color=fff&bold=true",
        politicalParty: "PSD (Social Democratic Party)",
        description: "Chairman of the Social Democratic Party and Speaker of the Chamber of Deputies. Career politician with extensive experience in local and national governance. Focuses on social policies, economic development, and strengthening Romania's position within the European Union. Advocates for increased social spending and support for working families."
      },
      {
        name: "Călin Georgescu",
        image: "https://ui-avatars.com/api/?name=Calin+Georgescu&size=400&background=059669&color=fff&bold=true",
        politicalParty: "Independent",
        description: "Independent political figure and former UN executive. Background in international relations and environmental policy. Served in various UN positions focusing on sustainable development. Advocates for national sovereignty, traditional values, and environmental protection. Known for his nationalist stance and criticism of globalist policies."
      },
      {
        name: "George Simion",
        image: "https://ui-avatars.com/api/?name=George+Simion&size=400&background=7c3aed&color=fff&bold=true",
        politicalParty: "AUR (Alliance for the Unity of Romanians)",
        description: "Chairman and co-founder of the Alliance for the Unity of Romanians party. Young politician known for his nationalist and conservative positions. Advocates for the unification of Romania with the Republic of Moldova, traditional family values, and Romanian sovereignty. Active in organizing protests and civic movements, particularly regarding Romanian diaspora rights."
      }
    ];

    for (const candidateData of defaultCandidates) {
      const candidate: Candidate = {
        ...candidateData,
        id: this.nextId++,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.candidates.push(candidate);
    }

    console.log('📡 [CandidateService] Emitting initial events after default candidates setup');
    this.emit('candidatesUpdated', this.getAllCandidates());
    this.emit('statsUpdated', this.getStats());
  }

  // Sync to global state
  private syncToGlobal() {
    globalCandidates = [...this.candidates];
    globalNextId = this.nextId;
  }

  // READ operations
  getAllCandidates(): Candidate[] {
    console.log(`🔍 [CandidateService] getAllCandidates() called - returning ${this.candidates.length} candidates`);
    return [...this.candidates];
  }

  getCandidateById(id: number): Candidate | null {
    const candidate = this.candidates.find(c => c.id === id) || null;
    console.log(`🔍 [CandidateService] getCandidateById(${id}) called - found: ${candidate ? candidate.name : 'null'}`);
    return candidate;
  }

  searchCandidates(query: string): Candidate[] {
    const searchTerm = query.toLowerCase();
    const results = this.candidates.filter(candidate => 
      candidate.name.toLowerCase().includes(searchTerm) ||
      candidate.politicalParty.toLowerCase().includes(searchTerm) ||
      candidate.description.toLowerCase().includes(searchTerm)
    );
    console.log(`🔍 [CandidateService] searchCandidates("${query}") called - found ${results.length} matches`);
    return results;
  }

  getStats(): CandidateStats[] {
    const partyStats = this.candidates.reduce((acc, candidate) => {
      acc[candidate.politicalParty] = (acc[candidate.politicalParty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const stats = Object.entries(partyStats).map(([party, count]) => ({
      party,
      count,
    }));
    
    console.log(`📊 [CandidateService] getStats() called - returning stats for ${stats.length} parties:`, 
      stats.map(s => `${s.party}: ${s.count}`).join(', '));
    return stats;
  }

  // CREATE operation
  createCandidate(input: CandidateCreateInput): Candidate {
    console.log(`✅ [CandidateService] createCandidate() called for: "${input.name}" (${input.politicalParty})`);
    
    const newCandidate: Candidate = {
      id: this.nextId++,
      name: input.name,
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(input.name)}&size=400&background=${Math.floor(Math.random()*16777215).toString(16)}&color=fff&bold=true`,
      politicalParty: input.politicalParty,
      description: input.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.candidates.push(newCandidate);
    this.syncToGlobal(); // Save to global state
    
    console.log(`📡 [CandidateService] New candidate added. Total candidates: ${this.candidates.length}`);
    console.log(`📡 [CandidateService] Updated candidates list:`, this.candidates.map(c => `${c.name} (ID: ${c.id})`));
    console.log(`📡 [CandidateService] EventEmitter listener count:`, this.listenerCount('candidateCreated'), this.listenerCount('candidatesUpdated'), this.listenerCount('statsUpdated'));
    console.log(`📡 [CandidateService] Emitting events for new candidate: ${newCandidate.name} (ID: ${newCandidate.id})`);
    
    // Emit events for real-time updates
    this.emit('candidateCreated', newCandidate);
    this.emit('candidatesUpdated', this.getAllCandidates());
    this.emit('statsUpdated', this.getStats());
    
    console.log(`📡 [CandidateService] Events emitted successfully for: ${newCandidate.name}`);
    
    return newCandidate;
  }

  // UPDATE operation
  updateCandidate(input: CandidateUpdateInput): Candidate {
    console.log(`✏️ [CandidateService] updateCandidate() called for ID: ${input.id} - "${input.name}"`);
    
    const candidateIndex = this.candidates.findIndex(c => c.id === input.id);
    if (candidateIndex === -1) {
      throw new Error("Candidate not found");
    }
    
    const existingCandidate = this.candidates[candidateIndex]!;
    const updatedCandidate: Candidate = {
      ...existingCandidate,
      name: input.name,
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(input.name)}&size=400&background=${Math.floor(Math.random()*16777215).toString(16)}&color=fff&bold=true`,
      politicalParty: input.politicalParty,
      description: input.description,
      updatedAt: new Date(),
    };
    
    this.candidates[candidateIndex] = updatedCandidate;
    this.syncToGlobal(); // Save to global state
    
    console.log(`📡 [CandidateService] Emitting events for updated candidate: ${updatedCandidate.name} (ID: ${updatedCandidate.id})`);
    
    // Emit events for real-time updates
    this.emit('candidateUpdated', updatedCandidate);
    this.emit('candidatesUpdated', this.getAllCandidates());
    this.emit('statsUpdated', this.getStats());
    
    return updatedCandidate;
  }

  // DELETE operation
  deleteCandidate(id: number): Candidate {
    console.log(`🗑️ [CandidateService] deleteCandidate() called for ID: ${id}`);
    
    const candidateIndex = this.candidates.findIndex(c => c.id === id);
    if (candidateIndex === -1) {
      throw new Error("Candidate not found");
    }
    
    const deletedCandidate = this.candidates[candidateIndex]!;
    this.candidates.splice(candidateIndex, 1);
    this.syncToGlobal(); // Save to global state
    
    console.log(`📡 [CandidateService] Emitting events for deleted candidate: ${deletedCandidate.name} (ID: ${deletedCandidate.id})`);
    
    // Emit events for real-time updates
    this.emit('candidateDeleted', deletedCandidate);
    this.emit('candidatesUpdated', this.getAllCandidates());
    this.emit('statsUpdated', this.getStats());
    
    return deletedCandidate;
  }

  // GENERATE operation
  generateRandomCandidate(): Candidate {
    console.log(`🎲 [CandidateService] generateRandomCandidate() called`);
    
    // Get existing parties
    const existingParties = [...new Set(this.candidates.map(c => c.politicalParty))];
    
    if (existingParties.length === 0) {
      throw new Error("No existing parties found");
    }

    // Random party selection
    const randomParty = existingParties[Math.floor(Math.random() * existingParties.length)]!;
    console.log(`🎲 [CandidateService] Selected random party: ${randomParty}`);
    
    // Generate random candidate data
    const firstNames = ["Alexandru", "Maria", "Ion", "Elena", "Mihai", "Ana", "Gheorghe", "Ioana", "Andrei", "Cristina", "Radu", "Simona", "Dan", "Raluca", "Adrian", "Roxana"];
    const lastNames = ["Popescu", "Ionescu", "Popa", "Stan", "Stoica", "Dumitrescu", "Georgescu", "Constantinescu", "Marin", "Diaconu", "Vlad", "Câmpeanu", "Moldovan", "Rus", "Barbu", "Nistor"];
    
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)]!;
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)]!;
    const fullName = `${randomFirstName} ${randomLastName}`;
    
    // Generate random background descriptions
    const backgrounds = [
      "Experienced local administrator with focus on community development and public services improvement.",
      "Former business leader with expertise in economic development and job creation initiatives.",
      "Legal professional specializing in public policy and constitutional law with parliamentary experience.",
      "Academic researcher with background in social sciences and public administration.",
      "Healthcare professional advocating for medical system reform and public health initiatives.",
      "Former journalist and communication specialist focused on transparency and media relations.",
      "Engineering background with expertise in infrastructure development and urban planning.",
      "Education sector veteran promoting educational reform and student welfare programs.",
      "Environmental advocate with experience in sustainable development and green policies.",
      "Technology entrepreneur focused on digital transformation and innovation in governance."
    ];
    
    const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)]!;
    
    const input: CandidateCreateInput = {
      name: fullName,
      politicalParty: randomParty,
      description: randomBackground,
    };

    return this.createCandidate(input);
  }

  // Get total count
  getTotalCount(): number {
    return this.candidates.length;
  }
}

// Singleton instance
let candidateService: CandidateService | null = null;

// Export a function that returns the singleton
export default function getCandidateService(): CandidateService {
  if (!candidateService) {
    candidateService = new CandidateService();
  }
  return candidateService;
}

// For backward compatibility, also export the instance directly
export const candidateServiceInstance = getCandidateService(); 