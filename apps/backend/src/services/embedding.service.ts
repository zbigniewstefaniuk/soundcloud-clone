import { pipeline } from '@huggingface/transformers'

interface TrackMetadata {
  title: string
  description?: string | null
  genre?: string | null
  mainArtist?: string | null
}

// Type for the feature extraction pipeline result
type FeatureExtractionPipeline = Awaited<ReturnType<typeof pipeline<'feature-extraction'>>>

class EmbeddingService {
  private embeddingPipeline: FeatureExtractionPipeline | null = null
  private initPromise: Promise<void> | null = null

  /**
   * Initialize the embedding pipeline with model caching
   * Uses sentence-transformers/all-MiniLM-L6-v2 - 384 dimensions, ~22MB, fast inference
   */
  async initialize(): Promise<void> {
    if (this.embeddingPipeline) return
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      console.log('Loading embedding model (sentence-transformers/all-MiniLM-L6-v2)...')
      this.embeddingPipeline = await pipeline(
        'feature-extraction',
        'sentence-transformers/all-MiniLM-L6-v2',
        { dtype: 'fp32' }, // Use fp32 for compatibility
      )
      console.log('Embedding model loaded successfully')
    })()

    await this.initPromise
  }

  /**
   * Generate embedding for track metadata
   * Combines title, description, genre, and mainArtist into single text
   */
  async generateTrackEmbedding(track: TrackMetadata): Promise<number[]> {
    await this.initialize()

    // Combine metadata into searchable text with field weighting
    // Title is repeated for implicit weighting as it's most important
    const textParts = [
      track.title,
      track.title, // Repeat title for weighting
      track.mainArtist,
      track.genre,
      track.description,
    ].filter((part): part is string => Boolean(part))

    const text = textParts.join(' ').trim()

    const result = await this.embeddingPipeline!(text, {
      pooling: 'mean',
      normalize: true,
    })

    return Array.from(result.data as Float32Array)
  }

  /**
   * Generate embedding for search query
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    await this.initialize()

    const result = await this.embeddingPipeline!(query, {
      pooling: 'mean',
      normalize: true,
    })

    return Array.from(result.data as Float32Array)
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.embeddingPipeline !== null
  }
}

export const embeddingService = new EmbeddingService()
