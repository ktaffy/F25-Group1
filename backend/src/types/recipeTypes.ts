/**
 * The recipe object structure returned to the frontend.
 */
export interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  summary: string;
  diets: string[];
  dishTypes: string[];
  ingredients: Ingredient[];
  instructions: InstructionStep[];
  averageRating: number | null;
  reviewCount: number;
}

/**
 * An ingredient object.
 */
export interface Ingredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  original: string;
  image?: string;
}

/**
 * A cooking step.
 */
export interface InstructionStep {
  number: number;
  step: string;
}
