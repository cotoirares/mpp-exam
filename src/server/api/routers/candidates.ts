import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import getCandidateService from "~/server/services/candidateService";
import type { Candidate } from "~/server/services/candidateService";

// Input validation schemas
const createCandidateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  politicalParty: z.string().min(1, "Political party is required").max(100, "Party name too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description too long"),
});

const updateCandidateSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  politicalParty: z.string().min(1, "Political party is required").max(100, "Party name too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description too long"),
});

export const candidatesRouter = createTRPCRouter({
  // READ operations
  getAll: publicProcedure.query(() => {
    console.log(`🔗 [tRPC] candidates.getAll called`);
    const candidateService = getCandidateService();
    const result = candidateService.getAllCandidates();
    console.log(`🔗 [tRPC] candidates.getAll returning ${result.length} candidates`);
    return result;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      console.log(`🔗 [tRPC] candidates.getById called with id: ${input.id}`);
      const candidateService = getCandidateService();
      const result = candidateService.getCandidateById(input.id);
      console.log(`🔗 [tRPC] candidates.getById returning: ${result ? result.name : 'null'}`);
      return result;
    }),

  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(({ input }) => {
      console.log(`🔗 [tRPC] candidates.search called with query: "${input.query}"`);
      const candidateService = getCandidateService();
      const result = candidateService.searchCandidates(input.query);
      console.log(`🔗 [tRPC] candidates.search returning ${result.length} matches`);
      return result;
    }),

  // CREATE operation
  create: publicProcedure
    .input(createCandidateSchema)
    .mutation(({ input }) => {
      console.log(`🔗 [tRPC] candidates.create called for: "${input.name}"`);
      const candidateService = getCandidateService();
      const result = candidateService.createCandidate(input);
      console.log(`🔗 [tRPC] candidates.create created: ${result.name} (ID: ${result.id})`);
      return result;
    }),

  // UPDATE operation
  update: publicProcedure
    .input(updateCandidateSchema)
    .mutation(({ input }) => {
      console.log(`🔗 [tRPC] candidates.update called for ID: ${input.id}`);
      const candidateService = getCandidateService();
      const result = candidateService.updateCandidate(input);
      console.log(`🔗 [tRPC] candidates.update updated: ${result.name}`);
      return result;
    }),

  // DELETE operation
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      console.log(`🔗 [tRPC] candidates.delete called for ID: ${input.id}`);
      const candidateService = getCandidateService();
      const result = candidateService.deleteCandidate(input.id);
      console.log(`🔗 [tRPC] candidates.delete deleted: ${result.name}`);
      return result;
    }),

  // GENERATE operation - Creates a random candidate for existing parties
  generate: publicProcedure
    .mutation(() => {
      console.log(`🔗 [tRPC] candidates.generate called`);
      const candidateService = getCandidateService();
      const result = candidateService.generateRandomCandidate();
      console.log(`🔗 [tRPC] candidates.generate created: ${result.name}`);
      return result;
    }),

  // Get statistics for chart
  getStats: publicProcedure.query(() => {
    console.log(`🔗 [tRPC] candidates.getStats called`);
    const candidateService = getCandidateService();
    const result = candidateService.getStats();
    console.log(`🔗 [tRPC] candidates.getStats returning stats for ${result.length} parties`);
    return result;
  }),

  // Get total count
  getTotalCount: publicProcedure.query(() => {
    const candidateService = getCandidateService();
    return candidateService.getTotalCount();
  }),
}); 