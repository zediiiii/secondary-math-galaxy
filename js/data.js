// ============================================================
// Secondary Math Galaxy — Taxonomy Data
// Source: Secondary Math Galaxy Hierarchical Taxonomy.xlsx
// ============================================================

const DOMAIN_COLORS = {
  HF: '#FF8C00',  // High School Functions — orange
  HG: '#FF4500',  // High School Geometry — red-orange
  HS: '#FFD700',  // High School Statistics — gold
  ME: '#9370DB',  // Expressions/Equations — purple
  MG: '#20B2AA',  // Middle School Geometry — teal
  MR: '#3CB371',  // Ratios/Proportions — green
};

// ------------------------------------------------------------------
// TIER 1: DOMAINS
// ------------------------------------------------------------------
const DOMAINS = [
  { id: 'HF', label: 'High School\nFunctions', tier: 1, domain: 'HF', description: 'Relationships between quantities and functional thinking spanning grades 9–12.' },
  { id: 'HG', label: 'High School\nGeometry', tier: 1, domain: 'HG', description: 'Spatial reasoning, proof, and transformations spanning grades 9–12.' },
  { id: 'HS', label: 'High School\nStatistics', tier: 1, domain: 'HS', description: 'Data analysis, inference, and variability spanning grades 9–12.' },
  { id: 'ME', label: 'Expressions &\nEquations', tier: 1, domain: 'ME', description: 'Algebraic reasoning and symbolic manipulation (Grades 6–8).' },
  { id: 'MG', label: 'Middle School\nGeometry', tier: 1, domain: 'MG', description: 'Shapes, measurement, and spatial reasoning (Grades 6–8).' },
  { id: 'MR', label: 'Ratios &\nProportions', tier: 1, domain: 'MR', description: 'Multiplicative relationships and proportional reasoning (Grades 6–8).' },
];

// ------------------------------------------------------------------
// TIER 2: BIG IDEAS
// ------------------------------------------------------------------
const BIG_IDEAS = [
  // HF
  { id: 'HF.COR', label: 'Correspondence', tier: 2, domain: 'HF', parent: 'HF', description: 'Mapping between input/output values — recognizing that x and y are mathematically linked.' },
  { id: 'HF.COV', label: 'Covariation', tier: 2, domain: 'HF', parent: 'HF', description: 'How quantities change together dynamically — the heart of functional reasoning.' },
  { id: 'HF.MAP', label: 'Mapping', tier: 2, domain: 'HF', parent: 'HF', description: 'Functions as objects with inputs, outputs, and processes — the "machine" view.' },
  // HG
  { id: 'HG.DIA', label: 'Diagrams', tier: 2, domain: 'HG', parent: 'HG', description: 'Visual representations and their meanings — literal vs. property-based reading.' },
  { id: 'HG.TRN', label: 'Transformations', tier: 2, domain: 'HG', parent: 'HG', description: 'Geometric motions and their properties — from action to relational understanding.' },
  { id: 'HG.PRF', label: 'Proof', tier: 2, domain: 'HG', parent: 'HG', description: 'Logical reasoning and justification — from empirical checking to deductive argument.' },
  // HS
  { id: 'HS.VAR', label: 'Variability', tier: 2, domain: 'HS', parent: 'HS', description: 'Understanding spread and distribution in data — local vs. global view.' },
  { id: 'HS.INF', label: 'Inference', tier: 2, domain: 'HS', parent: 'HS', description: 'Drawing conclusions from data — from intuition to quantified statistical reasoning.' },
  { id: 'HS.SAM', label: 'Sampling', tier: 2, domain: 'HS', parent: 'HS', description: 'Representative samples and populations — what makes a sample valid?' },
  // ME
  { id: 'ME.VAR', label: 'Variables', tier: 2, domain: 'ME', parent: 'ME', description: 'Different meanings and uses of variables — unknown, generalized number, or varying quantity.' },
  { id: 'ME.EQU', label: 'Equality', tier: 2, domain: 'ME', parent: 'ME', description: 'Meaning of the equals sign — balance and equivalence rather than an answer prompt.' },
  { id: 'ME.STR', label: 'Structure', tier: 2, domain: 'ME', parent: 'ME', description: 'Seeing and using mathematical structure in expressions — chunks vs. sequential steps.' },
  // MG
  { id: 'MG.SHP', label: 'Shapes', tier: 2, domain: 'MG', parent: 'MG', description: 'Defining and classifying geometric figures — from visual to abstract/relational.' },
  { id: 'MG.MEA', label: 'Measurement', tier: 2, domain: 'MG', parent: 'MG', description: 'Quantifying geometric attributes — from procedural to conceptual understanding.' },
  { id: 'MG.SPA', label: 'Spatial', tier: 2, domain: 'MG', parent: 'MG', description: 'Visualizing and manipulating shapes mentally — static vs. dynamic imagery.' },
  // MR
  { id: 'MR.REL', label: 'Relations', tier: 2, domain: 'MR', parent: 'MR', description: 'Different types of comparisons — qualitative, additive, and multiplicative.' },
  { id: 'MR.PRO', label: 'Proportions', tier: 2, domain: 'MR', parent: 'MR', description: 'Scaling and proportional relationships — from iterating to functional understanding.' },
];

// ------------------------------------------------------------------
// TIER 3: MENTAL ACTIONS
// ------------------------------------------------------------------
const MENTAL_ACTIONS = [
  // HF.COR
  { id: 'HF.COR.MA1', label: 'Recognition of\n"within" relationship', tier: 3, domain: 'HF', parent: 'HF.COR',
    description: 'Student notices that x and y are mathematically linked but cannot yet describe a general rule. (e.g., "whenever x is 2, y is 4")' },
  { id: 'HF.COR.MA2', label: 'Define/describe\nhow to take x to y', tier: 3, domain: 'HF', parent: 'HF.COR',
    description: 'Computational/Rule view — student can define or describe the operation taking x to y. (e.g., "multiply by 2")' },
  { id: 'HF.COR.MA3', label: 'Generalize a\nsymbolic equation', tier: 3, domain: 'HF', parent: 'HF.COR',
    description: 'Structural view — student writes a symbolic equation representing the entire relationship. (e.g., f(x) = 2x + 3)' },
  // HF.COV
  { id: 'HF.COV.MA1', label: 'Seeing dynamic\nchanges', tier: 3, domain: 'HF', parent: 'HF.COV',
    description: 'Variables change simultaneously — student recognizes that both quantities are changing. (e.g., "As time goes on, water level is changing")' },
  { id: 'HF.COV.MA2', label: 'Coordinating\ndirection of change', tier: 3, domain: 'HF', parent: 'HF.COV',
    description: 'As x increases, y increases/decreases — student tracks direction of change. (e.g., "As distance increases, signal strength decreases")' },
  { id: 'HF.COV.MA3', label: 'Coordinating\namount of change', tier: 3, domain: 'HF', parent: 'HF.COV',
    description: 'As x increases by Δx, y changes by Δy — student tracks and quantifies amounts. (e.g., "for every 2 seconds, height increases by 10 feet")' },
  { id: 'HF.COV.MA4', label: 'Coordinating average\nrate of change', tier: 3, domain: 'HF', parent: 'HF.COV',
    description: 'Δy/Δx ratio — student calculates and reasons with average rate of change over an interval.' },
  { id: 'HF.COV.MA5', label: 'Coordinating instantaneous\nrate of change', tier: 3, domain: 'HF', parent: 'HF.COV',
    description: 'Limit of the rate — student reasons about speed/rate at an exact instant using tangent lines or limits.' },
  // HF.MAP
  { id: 'HF.MAP.MA1', label: 'Object view', tier: 3, domain: 'HF', parent: 'HF.MAP',
    description: 'Function as an entity/set of ordered pairs — student lists the function as pairs: {(1,2), (3,4)}.' },
  { id: 'HF.MAP.MA2', label: 'Process view', tier: 3, domain: 'HF', parent: 'HF.MAP',
    description: 'Function as a machine/input-output mapping — student draws a "function machine" showing inputs turning into outputs.' },
  // HG.DIA
  { id: 'HG.DIA.MA1', label: 'Diagrams as\nliteral pictures', tier: 3, domain: 'HG', parent: 'HG.DIA',
    description: 'Physical attributes dominate — student judges geometry by appearance. (e.g., "it\'s not isosceles because it looks tilted")' },
  { id: 'HG.DIA.MA2', label: 'Diagrams as\nproperty representations', tier: 3, domain: 'HG', parent: 'HG.DIA',
    description: 'Geometric attributes dominate — student uses tick marks and labels to prove properties, ignoring visual appearance.' },
  // HG.TRN
  { id: 'HG.TRN.MA1', label: 'Action view', tier: 3, domain: 'HG', parent: 'HG.TRN',
    description: 'Motion of a single object — student physically slides a cutout to show translation.' },
  { id: 'HG.TRN.MA2', label: 'Relational view', tier: 3, domain: 'HG', parent: 'HG.TRN',
    description: 'Mapping of the entire plane — student describes translation as a vector (a,b) added to every point (x,y).' },
  // HG.PRF
  { id: 'HG.PRF.MA1', label: 'Empirical\njustification', tier: 3, domain: 'HG', parent: 'HG.PRF',
    description: 'Checking valid cases/measuring — student measures three triangles and concludes "it works for all of them."' },
  { id: 'HG.PRF.MA2', label: 'Generic example', tier: 3, domain: 'HG', parent: 'HG.PRF',
    description: 'Reasoning about a general case — student uses a "generic" drawing, explaining "this would happen for any triangle."' },
  { id: 'HG.PRF.MA3', label: 'Deductive\nargument', tier: 3, domain: 'HG', parent: 'HG.PRF',
    description: 'Formal chain of reasoning — student writes a two-column proof citing Side-Angle-Side postulate.' },
  // HS.VAR
  { id: 'HS.VAR.MA1', label: 'Local view', tier: 3, domain: 'HS', parent: 'HS.VAR',
    description: 'Focus on individual data points/outliers — student points to the one student who scored 100% and ignores the low average.' },
  { id: 'HS.VAR.MA2', label: 'Global view', tier: 3, domain: 'HS', parent: 'HS.VAR',
    description: 'Focus on the aggregate/shape of the whole — student describes the "bump" in the middle of the histogram as typical performance.' },
  // HS.INF
  { id: 'HS.INF.MA1', label: 'Subjective\njudgment', tier: 3, domain: 'HS', parent: 'HS.INF',
    description: 'Based on personal intuition/belief — student predicts it will rain because "it feels like rain today."' },
  { id: 'HS.INF.MA2', label: 'Transitional\nreasoning', tier: 3, domain: 'HS', parent: 'HS.INF',
    description: 'Using informal probability/trends — student looks at past data and says "it usually rains in April."' },
  { id: 'HS.INF.MA3', label: 'Quantified\ninference', tier: 3, domain: 'HS', parent: 'HS.INF',
    description: 'Using p-values, confidence intervals, formal models — student calculates a 95% confidence interval.' },
  // HS.SAM
  { id: 'HS.SAM.MA1', label: 'Sample as\na subset', tier: 3, domain: 'HS', parent: 'HS.SAM',
    description: 'Just "part" of the whole — student surveys only their best friends to represent the whole school.' },
  { id: 'HS.SAM.MA2', label: 'Representative\nsample', tier: 3, domain: 'HS', parent: 'HS.SAM',
    description: 'Reflects the population structure — student uses a random number generator to pick students from every grade level.' },
  // ME.VAR
  { id: 'ME.VAR.MA1', label: 'Variable as\nspecific unknown', tier: 3, domain: 'ME', parent: 'ME.VAR',
    description: '(Grades 6–8) e.g., 3+x=7 — student solves for x and thinks x is always 5.' },
  { id: 'ME.VAR.MA2', label: 'Variable as\ngeneralized number', tier: 3, domain: 'ME', parent: 'ME.VAR',
    description: 'e.g., a+b=b+a — student explains this works for any numbers.' },
  { id: 'ME.VAR.MA3', label: 'Variable as\nvarying quantity', tier: 3, domain: 'ME', parent: 'ME.VAR',
    description: 'Relationship between changing values — student describes how changing m changes the steepness of a line.' },
  // ME.EQU
  { id: 'ME.EQU.MA1', label: 'Operational view', tier: 3, domain: 'ME', parent: 'ME.EQU',
    description: 'The "answer" comes next — student writes "12" after "5+7=" seeing the equals sign as "do the answer."' },
  { id: 'ME.EQU.MA2', label: 'Relational view', tier: 3, domain: 'ME', parent: 'ME.EQU',
    description: 'Equivalence/Balance between two sides — student balances the equation by subtracting 5 from both sides.' },
  // ME.STR
  { id: 'ME.STR.MA1', label: 'Reading expressions\nsequentially', tier: 3, domain: 'ME', parent: 'ME.STR',
    description: 'Left-to-right calculation — student computes 3(x+2) by saying "3 times x, then plus 2."' },
  { id: 'ME.STR.MA2', label: 'Reading expressions\nstructurally', tier: 3, domain: 'ME', parent: 'ME.STR',
    description: 'Seeing chunks/terms as objects — student sees (x+2) as a single chunk that can be factored out.' },
  // MG.SHP
  { id: 'MG.SHP.MA1', label: 'Visual recognition', tier: 3, domain: 'MG', parent: 'MG.SHP',
    description: 'It looks like a... — student identifies a rectangle because "it looks like a door."' },
  { id: 'MG.SHP.MA2', label: 'Descriptive/Analytic', tier: 3, domain: 'MG', parent: 'MG.SHP',
    description: 'It has 4 sides and right angles — student checks properties systematically.' },
  { id: 'MG.SHP.MA3', label: 'Abstract/Relational', tier: 3, domain: 'MG', parent: 'MG.SHP',
    description: 'Class inclusion — student acknowledges that a square is technically a rectangle.' },
  // MG.MEA
  { id: 'MG.MEA.MA1', label: 'Procedure', tier: 3, domain: 'MG', parent: 'MG.MEA',
    description: 'Applying a formula blindly — student multiplies length × width without understanding why it equals area.' },
  { id: 'MG.MEA.MA2', label: 'Conceptual', tier: 3, domain: 'MG', parent: 'MG.MEA',
    description: 'Understanding area as covering/decomposition — student explains area as "how many 1×1 squares cover the shape."' },
  // MG.SPA
  { id: 'MG.SPA.MA1', label: 'Static imagery', tier: 3, domain: 'MG', parent: 'MG.SPA',
    description: 'Seeing the shape as it is — student cannot tell what the shape looks like from the back.' },
  { id: 'MG.SPA.MA2', label: 'Dynamic imagery', tier: 3, domain: 'MG', parent: 'MG.SPA',
    description: 'Mentally rotating or unfolding the shape — student correctly draws the net of a cube by unfolding it mentally.' },
  // MR.REL
  { id: 'MR.REL.MA1', label: 'Qualitative\ncomparison', tier: 3, domain: 'MR', parent: 'MR.REL',
    description: 'Bigger/Smaller — student says "Group A has more boys than Group B" (just counts).' },
  { id: 'MR.REL.MA2', label: 'Additive\ncomparison', tier: 3, domain: 'MR', parent: 'MR.REL',
    description: 'Using difference, a−b — student says "Group A has 2 more boys than Group B."' },
  { id: 'MR.REL.MA3', label: 'Multiplicative\ncomparison', tier: 3, domain: 'MR', parent: 'MR.REL',
    description: 'Using ratios, a/b — student says "Group A has twice as many boys as Group B."' },
  // MR.PRO
  { id: 'MR.PRO.MA1', label: 'Iterating/\nPartitioning', tier: 3, domain: 'MR', parent: 'MR.PRO',
    description: 'Building up units — student finds the ratio for 6 people by adding the recipe for 2 people three times.' },
  { id: 'MR.PRO.MA2', label: 'Scaling', tier: 3, domain: 'MR', parent: 'MR.PRO',
    description: 'Using a scale factor within or between measures — student multiplies the entire recipe by 3.' },
  { id: 'MR.PRO.MA3', label: 'Functional', tier: 3, domain: 'MR', parent: 'MR.PRO',
    description: 'Using the constant of proportionality y=kx — student sets up y=1.5x where 1.5 is the unit rate per person.' },
];

// ------------------------------------------------------------------
// TIER 4: SAMPLES (one per Mental Action from the taxonomy)
// ------------------------------------------------------------------
const SAMPLES = [
  { id: 'HF.COR.MA1.S1', label: 'Sample', tier: 4, domain: 'HF', parent: 'HF.COR.MA1',
    description: 'Student notices that "whenever x is 2, y is 4," identifying a link but not a general rule.', mediaLink: '' },
  { id: 'HF.COR.MA2.S1', label: 'Sample', tier: 4, domain: 'HF', parent: 'HF.COR.MA2',
    description: 'Student writes "multiply by 2" as the rule to get from input to output.', mediaLink: '' },
  { id: 'HF.COR.MA3.S1', label: 'Sample', tier: 4, domain: 'HF', parent: 'HF.COR.MA3',
    description: 'Student writes f(x) = 2x + 3 to represent the entire relationship symbolically.', mediaLink: '' },
  { id: 'HF.COV.MA1.S1', label: 'Sample', tier: 4, domain: 'HF', parent: 'HF.COV.MA1',
    description: 'Student says "As time goes on, the water level is changing."', mediaLink: '' },
  { id: 'HF.COV.MA2.S1', label: 'Sample', tier: 4, domain: 'HF', parent: 'HF.COV.MA2',
    description: 'Student notes "As the distance increases, the signal strength decreases."', mediaLink: '' },
  { id: 'HF.COV.MA3.S1', label: 'Sample', tier: 4, domain: 'HF', parent: 'HF.COV.MA3',
    description: 'Student calculates that for every 2 seconds, the height increases by a fixed amount.', mediaLink: '' },
  { id: 'HF.COV.MA4.S1', label: 'Sample', tier: 4, domain: 'HF', parent: 'HF.COV.MA4',
    description: 'Student calculates the average speed over the whole trip as Δy/Δx.', mediaLink: '' },
  { id: 'HF.COV.MA5.S1', label: 'Sample', tier: 4, domain: 'HF', parent: 'HF.COV.MA5',
    description: 'Student discusses the speed at exactly t=5 seconds using tangent lines.', mediaLink: '' },
  { id: 'HF.MAP.MA1.S1', label: 'Sample', tier: 4, domain: 'HF', parent: 'HF.MAP.MA1',
    description: 'Student lists the function as a set of pairs: {(1,2), (3,4)}.', mediaLink: '' },
  { id: 'HF.MAP.MA2.S1', label: 'Sample', tier: 4, domain: 'HF', parent: 'HF.MAP.MA2',
    description: 'Student draws a "function machine" showing inputs turning into outputs.', mediaLink: '' },
  { id: 'HG.DIA.MA1.S1', label: 'Sample', tier: 4, domain: 'HG', parent: 'HG.DIA.MA1',
    description: 'Student argues the triangle isn\'t isosceles because "it looks tilted to the left."', mediaLink: '' },
  { id: 'HG.DIA.MA2.S1', label: 'Sample', tier: 4, domain: 'HG', parent: 'HG.DIA.MA2',
    description: 'Student marks the tick marks on the sides to prove it is isosceles, ignoring the tilt.', mediaLink: '' },
  { id: 'HG.TRN.MA1.S1', label: 'Sample', tier: 4, domain: 'HG', parent: 'HG.TRN.MA1',
    description: 'Student physically slides a paper cutout to show the translation.', mediaLink: '' },
  { id: 'HG.TRN.MA2.S1', label: 'Sample', tier: 4, domain: 'HG', parent: 'HG.TRN.MA2',
    description: 'Student describes the translation as a vector adding (a,b) to every point (x,y).', mediaLink: '' },
  { id: 'HG.PRF.MA1.S1', label: 'Sample', tier: 4, domain: 'HG', parent: 'HG.PRF.MA1',
    description: 'Student measures three different triangles and says "it works for all of them."', mediaLink: '' },
  { id: 'HG.PRF.MA2.S1', label: 'Sample', tier: 4, domain: 'HG', parent: 'HG.PRF.MA2',
    description: 'Student explains the logic using a "generic" drawing, saying "this would happen for any triangle."', mediaLink: '' },
  { id: 'HG.PRF.MA3.S1', label: 'Sample', tier: 4, domain: 'HG', parent: 'HG.PRF.MA3',
    description: 'Student writes a two-column proof citing the Side-Angle-Side postulate.', mediaLink: '' },
  { id: 'HS.VAR.MA1.S1', label: 'Sample', tier: 4, domain: 'HS', parent: 'HS.VAR.MA1',
    description: 'Student points to the one student who scored 100% and ignores the low average.', mediaLink: '' },
  { id: 'HS.VAR.MA2.S1', label: 'Sample', tier: 4, domain: 'HS', parent: 'HS.VAR.MA2',
    description: 'Student describes the "bump" in the middle of the histogram as the typical performance.', mediaLink: '' },
  { id: 'HS.INF.MA1.S1', label: 'Sample', tier: 4, domain: 'HS', parent: 'HS.INF.MA1',
    description: 'Student predicts it will rain because "it feels like rain today."', mediaLink: '' },
  { id: 'HS.INF.MA2.S1', label: 'Sample', tier: 4, domain: 'HS', parent: 'HS.INF.MA2',
    description: 'Student looks at past weather data and says "it usually rains in April."', mediaLink: '' },
  { id: 'HS.INF.MA3.S1', label: 'Sample', tier: 4, domain: 'HS', parent: 'HS.INF.MA3',
    description: 'Student calculates a 95% confidence interval for the probability of rain.', mediaLink: '' },
  { id: 'HS.SAM.MA1.S1', label: 'Sample', tier: 4, domain: 'HS', parent: 'HS.SAM.MA1',
    description: 'Student surveys only their best friends to represent the whole school.', mediaLink: '' },
  { id: 'HS.SAM.MA2.S1', label: 'Sample', tier: 4, domain: 'HS', parent: 'HS.SAM.MA2',
    description: 'Student uses a random number generator to pick students from every grade level.', mediaLink: '' },
  { id: 'ME.VAR.MA1.S1', label: 'Sample', tier: 4, domain: 'ME', parent: 'ME.VAR.MA1',
    description: 'Student solves x+5=10 and thinks x is always 5.', mediaLink: '' },
  { id: 'ME.VAR.MA2.S1', label: 'Sample', tier: 4, domain: 'ME', parent: 'ME.VAR.MA2',
    description: 'Student explains that a+b=b+a works for any numbers.', mediaLink: '' },
  { id: 'ME.VAR.MA3.S1', label: 'Sample', tier: 4, domain: 'ME', parent: 'ME.VAR.MA3',
    description: 'Student describes how changing m changes the steepness of the line.', mediaLink: '' },
  { id: 'ME.EQU.MA1.S1', label: 'Sample', tier: 4, domain: 'ME', parent: 'ME.EQU.MA1',
    description: 'Student writes "12" after "5+7=" seeing the equals sign as "do the answer."', mediaLink: '' },
  { id: 'ME.EQU.MA2.S1', label: 'Sample', tier: 4, domain: 'ME', parent: 'ME.EQU.MA2',
    description: 'Student balances the equation by subtracting 5 from both sides.', mediaLink: '' },
  { id: 'ME.STR.MA1.S1', label: 'Sample', tier: 4, domain: 'ME', parent: 'ME.STR.MA1',
    description: 'Student computes 3(x+2) by saying "3 times x, then plus 2."', mediaLink: '' },
  { id: 'ME.STR.MA2.S1', label: 'Sample', tier: 4, domain: 'ME', parent: 'ME.STR.MA2',
    description: 'Student sees (x+2) as a single chunk that can be factored out.', mediaLink: '' },
  { id: 'MG.SHP.MA1.S1', label: 'Sample', tier: 4, domain: 'MG', parent: 'MG.SHP.MA1',
    description: 'Student identifies a rectangle because "it looks like a door."', mediaLink: '' },
  { id: 'MG.SHP.MA2.S1', label: 'Sample', tier: 4, domain: 'MG', parent: 'MG.SHP.MA2',
    description: 'Student checks that the shape has 4 right angles and opposite equal sides.', mediaLink: '' },
  { id: 'MG.SHP.MA3.S1', label: 'Sample', tier: 4, domain: 'MG', parent: 'MG.SHP.MA3',
    description: 'Student acknowledges that a square is technically a rectangle.', mediaLink: '' },
  { id: 'MG.MEA.MA1.S1', label: 'Sample', tier: 4, domain: 'MG', parent: 'MG.MEA.MA1',
    description: 'Student multiplies length × width without understanding why it equals area.', mediaLink: '' },
  { id: 'MG.MEA.MA2.S1', label: 'Sample', tier: 4, domain: 'MG', parent: 'MG.MEA.MA2',
    description: 'Student explains area as "how many 1×1 squares cover the shape."', mediaLink: '' },
  { id: 'MG.SPA.MA1.S1', label: 'Sample', tier: 4, domain: 'MG', parent: 'MG.SPA.MA1',
    description: 'Student cannot tell what the shape looks like from the back.', mediaLink: '' },
  { id: 'MG.SPA.MA2.S1', label: 'Sample', tier: 4, domain: 'MG', parent: 'MG.SPA.MA2',
    description: 'Student correctly draws the net of a cube by unfolding it mentally.', mediaLink: '' },
  { id: 'MR.REL.MA1.S1', label: 'Sample', tier: 4, domain: 'MR', parent: 'MR.REL.MA1',
    description: 'Student says "Group A has more boys than Group B" (just counts).', mediaLink: '' },
  { id: 'MR.REL.MA2.S1', label: 'Sample', tier: 4, domain: 'MR', parent: 'MR.REL.MA2',
    description: 'Student says "Group A has 2 more boys than Group B" (additive).', mediaLink: '' },
  { id: 'MR.REL.MA3.S1', label: 'Sample', tier: 4, domain: 'MR', parent: 'MR.REL.MA3',
    description: 'Student says "Group A has twice as many boys as Group B" (multiplicative).', mediaLink: '' },
  { id: 'MR.PRO.MA1.S1', label: 'Sample', tier: 4, domain: 'MR', parent: 'MR.PRO.MA1',
    description: 'Student finds the ratio for 6 people by adding the recipe for 2 people three times.', mediaLink: '' },
  { id: 'MR.PRO.MA2.S1', label: 'Sample', tier: 4, domain: 'MR', parent: 'MR.PRO.MA2',
    description: 'Student multiplies the entire recipe by 3.', mediaLink: '' },
  { id: 'MR.PRO.MA3.S1', label: 'Sample', tier: 4, domain: 'MR', parent: 'MR.PRO.MA3',
    description: 'Student sets up y=1.5x where 1.5 is the unit rate per person.', mediaLink: '' },
];

// ------------------------------------------------------------------
// WITHIN-DOMAIN CONNECTIONS (progression edges)
// ------------------------------------------------------------------
const CONNECTIONS = [
  // Tier 1→2 (Domain to Big Idea)
  ...BIG_IDEAS.map(bi => ({ from: bi.parent, to: bi.id, type: 'hierarchy', weight: 10 })),
  // Tier 2→3 (Big Idea to Mental Action)
  ...MENTAL_ACTIONS.map(ma => ({ from: ma.parent, to: ma.id, type: 'hierarchy', weight: 8 })),
  // Tier 3→4 (Mental Action to Sample)
  ...SAMPLES.map(s => ({ from: s.parent, to: s.id, type: 'hierarchy', weight: 5 })),

  // Progression edges within Big Ideas (MA1→MA2→MA3 etc.)
  { from: 'HF.COR.MA1', to: 'HF.COR.MA2', type: 'progression', weight: 7, description: 'MA2 builds upon MA1' },
  { from: 'HF.COR.MA2', to: 'HF.COR.MA3', type: 'progression', weight: 7 },
  { from: 'HF.COV.MA1', to: 'HF.COV.MA2', type: 'progression', weight: 7 },
  { from: 'HF.COV.MA2', to: 'HF.COV.MA3', type: 'progression', weight: 7 },
  { from: 'HF.COV.MA3', to: 'HF.COV.MA4', type: 'progression', weight: 7 },
  { from: 'HF.COV.MA4', to: 'HF.COV.MA5', type: 'progression', weight: 7 },
  { from: 'HF.MAP.MA1', to: 'HF.MAP.MA2', type: 'progression', weight: 7 },
  { from: 'HG.DIA.MA1', to: 'HG.DIA.MA2', type: 'progression', weight: 7 },
  { from: 'HG.TRN.MA1', to: 'HG.TRN.MA2', type: 'progression', weight: 7 },
  { from: 'HG.PRF.MA1', to: 'HG.PRF.MA2', type: 'progression', weight: 7 },
  { from: 'HG.PRF.MA2', to: 'HG.PRF.MA3', type: 'progression', weight: 7 },
  { from: 'HS.VAR.MA1', to: 'HS.VAR.MA2', type: 'progression', weight: 7 },
  { from: 'HS.INF.MA1', to: 'HS.INF.MA2', type: 'progression', weight: 7 },
  { from: 'HS.INF.MA2', to: 'HS.INF.MA3', type: 'progression', weight: 7 },
  { from: 'HS.SAM.MA1', to: 'HS.SAM.MA2', type: 'progression', weight: 7 },
  { from: 'ME.VAR.MA1', to: 'ME.VAR.MA2', type: 'progression', weight: 7 },
  { from: 'ME.VAR.MA2', to: 'ME.VAR.MA3', type: 'progression', weight: 7 },
  { from: 'ME.EQU.MA1', to: 'ME.EQU.MA2', type: 'progression', weight: 7 },
  { from: 'ME.STR.MA1', to: 'ME.STR.MA2', type: 'progression', weight: 7 },
  { from: 'MG.SHP.MA1', to: 'MG.SHP.MA2', type: 'progression', weight: 7 },
  { from: 'MG.SHP.MA2', to: 'MG.SHP.MA3', type: 'progression', weight: 7 },
  { from: 'MG.MEA.MA1', to: 'MG.MEA.MA2', type: 'progression', weight: 7 },
  { from: 'MG.SPA.MA1', to: 'MG.SPA.MA2', type: 'progression', weight: 7 },
  { from: 'MR.REL.MA1', to: 'MR.REL.MA2', type: 'progression', weight: 7 },
  { from: 'MR.REL.MA2', to: 'MR.REL.MA3', type: 'progression', weight: 7 },
  { from: 'MR.PRO.MA1', to: 'MR.PRO.MA2', type: 'progression', weight: 7 },
  { from: 'MR.PRO.MA2', to: 'MR.PRO.MA3', type: 'progression', weight: 7 },
];

// ------------------------------------------------------------------
// CROSS-DOMAIN CONNECTIONS ("gravitational pulls")
// ------------------------------------------------------------------
const CROSS_DOMAIN = [
  { id: 'XD_001', from: 'MR.PRO.MA3', to: 'HF.COR.MA3', type: 'conceptual-bridge', strength: 9,
    description: 'Proportional reasoning (y=kx) is the foundation for linear correspondence.' },
  { id: 'XD_002', from: 'ME.VAR.MA3', to: 'HF.COV.MA1', type: 'conceptual-bridge', strength: 8,
    description: 'Seeing variables as varying quantities unlocks covariation thinking.' },
  { id: 'XD_003', from: 'MR.REL.MA3', to: 'HF.COR.MA1', type: 'conceptual-bridge', strength: 7,
    description: 'Multiplicative comparison is an early form of functional correspondence.' },
  { id: 'XD_004', from: 'ME.EQU.MA2', to: 'HF.MAP.MA2', type: 'conceptual-bridge', strength: 6,
    description: 'Relational equality supports the process/machine view of functions.' },
  { id: 'XD_005', from: 'MG.SPA.MA2', to: 'HG.TRN.MA2', type: 'conceptual-bridge', strength: 8,
    description: 'Dynamic spatial imagery is the foundation for relational transformation.' },
  { id: 'XD_006', from: 'MG.SHP.MA3', to: 'HG.DIA.MA2', type: 'conceptual-bridge', strength: 7,
    description: 'Abstract/relational shape reasoning connects to property-based diagram reading.' },
  { id: 'XD_007', from: 'HS.VAR.MA2', to: 'HS.INF.MA2', type: 'conceptual-bridge', strength: 7,
    description: 'Global view of variability enables transitional inferential reasoning.' },
  { id: 'XD_008', from: 'MR.PRO.MA2', to: 'HF.COV.MA3', type: 'conceptual-bridge', strength: 8,
    description: 'Scaling (multiplicative) reasoning connects to coordinating amount of change.' },
];

// ------------------------------------------------------------------
// TASKS
// ------------------------------------------------------------------
const TASKS = [
  // Linear
  { id: 'Task_Lin1', label: 'The Walking Rate', category: 'Linear', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COR.MA1', 'HF.COR.MA2', 'HF.COV.MA2', 'HF.COV.MA3'],
    sampleTags: ['Lin'],
    beforeContext: [
      { maId: 'HF.COV.MA2', type: 'Purposeful Question', content: 'Ask: What happens to the distance as time increases? How do you know?' },
      { maId: 'HF.COV.MA3', type: 'Anticipated Model', content: 'Students may use a table showing constant differences. Highlight the constant rate.' },
    ],
    afterContext: [
      { maId: 'HF.COV.MA2', type: 'Scaffolding', content: 'If stuck on direction: cover the numbers and ask about the trend from the graph.' },
      { maId: 'HF.COV.MA3', type: 'Intervention', content: 'Use a difference table to make the constant change visible. Ask: "What is the same in every row?"' },
    ],
  },
  { id: 'Task_Lin2', label: 'Phone Plan Comparison', category: 'Linear', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COR.MA2', 'HF.COR.MA3', 'HF.COV.MA3', 'HF.COV.MA4'],
    sampleTags: ['Lin'],
    beforeContext: [
      { maId: 'HF.COV.MA3', type: 'Purposeful Question', content: 'Ask: How much does the cost change for each additional minute? Is that always the same?' },
    ],
    afterContext: [
      { maId: 'HF.COV.MA4', type: 'Scaffolding', content: 'Calculate Δcost/Δminutes for two intervals. Compare. What does this ratio mean?' },
    ],
  },
  { id: 'Task_Lin3', label: 'Filling the Tank', category: 'Linear', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COV.MA1', 'HF.COV.MA2', 'HF.COV.MA3'],
    sampleTags: ['Lin'],
    beforeContext: [
      { maId: 'HF.COV.MA1', type: 'Purposeful Question', content: 'Ask: What two quantities are changing here? Can you name them both?' },
    ],
    afterContext: [
      { maId: 'HF.COV.MA2', type: 'Intervention', content: 'If students only track one variable, ask: "What is happening to the tank level as time passes?"' },
    ],
  },
  // Exponential
  { id: 'Task_Exp1', label: 'Bacteria Growth', category: 'Exponential', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COV.MA2', 'HF.COV.MA3', 'HF.COV.MA4'],
    sampleTags: ['Exp'],
    beforeContext: [
      { maId: 'HF.COV.MA3', type: 'Purposeful Question', content: 'Ask: Is the amount of change the same each hour? How does it compare to the previous hour?' },
    ],
    afterContext: [
      { maId: 'HF.COV.MA3', type: 'Scaffolding', content: 'Build a ratio table: amount at hour n / amount at hour (n-1). What pattern do you see?' },
    ],
  },
  { id: 'Task_Exp2', label: 'The Pay It Forward Chain', category: 'Exponential', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COV.MA1', 'HF.COV.MA2', 'HF.COR.MA2'],
    sampleTags: ['Exp'],
    beforeContext: [
      { maId: 'HF.COV.MA2', type: 'Purposeful Question', content: 'Ask: As the number of rounds increases, what happens to the number of people helped?' },
    ],
    afterContext: [],
  },
  { id: 'Task_Exp3', label: 'Radioactive Decay', category: 'Exponential', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COV.MA2', 'HF.COV.MA3', 'HF.COV.MA4'],
    sampleTags: ['Exp'],
    beforeContext: [
      { maId: 'HF.COV.MA4', type: 'Purposeful Question', content: 'Ask: How does the average rate of change compare in the first half-life vs. the second?' },
    ],
    afterContext: [],
  },
  // Quadratic
  { id: 'Task_Quad1', label: 'The Rocket Launch', category: 'Quadratic', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COV.MA2', 'HF.COV.MA3', 'HF.COV.MA4'],
    sampleTags: ['Quad'],
    beforeContext: [
      { maId: 'HF.COV.MA3', type: 'Purposeful Question', content: 'Ask: How much is height changing each second? Is that amount constant?' },
      { maId: 'HF.COV.MA3', type: 'Anticipated Model', content: 'Students may build a difference table. Celebrate this and push to a second-difference table.' },
    ],
    afterContext: [
      { maId: 'HF.COV.MA3', type: 'Scaffolding', content: 'Use tables to focus on amount of change. Ask: "What if we look at how much the change itself is changing?"' },
    ],
  },
  { id: 'Task_Quad2', label: 'Garden Area Maximization', category: 'Quadratic', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COR.MA2', 'HF.COR.MA3', 'HF.COV.MA3'],
    sampleTags: ['Quad'],
    beforeContext: [
      { maId: 'HF.COR.MA2', type: 'Purposeful Question', content: 'Ask: Can you write a rule connecting the width to the area? What information do you need?' },
    ],
    afterContext: [],
  },
  { id: 'Task_Quad3', label: 'The Suspension Bridge', category: 'Quadratic', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COR.MA3', 'HF.MAP.MA1', 'HF.MAP.MA2'],
    sampleTags: ['Quad'],
    beforeContext: [],
    afterContext: [],
  },
  // Logarithmic
  { id: 'Task_Log1', label: 'Earthquake Magnitude', category: 'Logarithmic', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COV.MA3', 'HF.COV.MA4', 'HF.MAP.MA2'],
    sampleTags: ['Log'],
    beforeContext: [
      { maId: 'HF.COV.MA3', type: 'Purposeful Question', content: 'Ask: When the magnitude goes up by 1, what happens to the actual energy released?' },
    ],
    afterContext: [],
  },
  { id: 'Task_Log2', label: 'pH Levels in Water', category: 'Logarithmic', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COV.MA2', 'HF.COV.MA3', 'HF.COR.MA2'],
    sampleTags: ['Log'],
    beforeContext: [],
    afterContext: [],
  },
  { id: 'Task_Log3', label: 'Sound Intensity (Decibels)', category: 'Logarithmic', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COV.MA3', 'HF.COV.MA4', 'HF.COR.MA3'],
    sampleTags: ['Log'],
    beforeContext: [],
    afterContext: [],
  },
  // Trigonometric
  { id: 'Task_Trig1', label: 'Ferris Wheel Height', category: 'Trigonometric', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COV.MA1', 'HF.COV.MA2', 'HF.COV.MA3'],
    sampleTags: ['Trig'],
    beforeContext: [
      { maId: 'HF.COV.MA1', type: 'Purposeful Question', content: 'Ask: What two quantities are changing as the wheel spins? How are they related?' },
    ],
    afterContext: [],
  },
  { id: 'Task_Trig2', label: 'Tides at the Pier', category: 'Trigonometric', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COV.MA2', 'HF.COV.MA3', 'HF.COR.MA3'],
    sampleTags: ['Trig'],
    beforeContext: [],
    afterContext: [],
  },
  { id: 'Task_Trig3', label: 'Sound Wave Modeling', category: 'Trigonometric', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COV.MA3', 'HF.COR.MA3', 'HF.MAP.MA1'],
    sampleTags: ['Trig'],
    beforeContext: [],
    afterContext: [],
  },
  // Rational
  { id: 'Task_Rat1', label: 'Mixing Solutions', category: 'Rational', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COV.MA2', 'HF.COR.MA2', 'HF.MAP.MA2'],
    sampleTags: ['Rat'],
    beforeContext: [],
    afterContext: [],
  },
  { id: 'Task_Rat2', label: 'The Work Rate Problem', category: 'Rational', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COR.MA2', 'HF.COR.MA3', 'HF.COV.MA3'],
    sampleTags: ['Rat'],
    beforeContext: [],
    afterContext: [],
  },
  { id: 'Task_Rat3', label: 'Average Cost of Production', category: 'Rational', domain: 'HF',
    pdfLink: '', targetMAs: ['HF.COV.MA3', 'HF.COV.MA4', 'HF.COR.MA3'],
    sampleTags: ['Rat'],
    beforeContext: [],
    afterContext: [],
  },
];

// ------------------------------------------------------------------
// ABOUT CONTENT
// ------------------------------------------------------------------
const ABOUT_CONTENT = {
  title: 'Secondary Math Galaxy',
  subtitle: 'A Traversable Galaxy of Mathematical Understanding',
  sections: [
    {
      heading: 'The Inspiration',
      body: `In elementary mathematics, Cathy Fosnot's "Landscapes of Learning" revolutionized instruction by giving teachers a map of a single conceptual terrain — allowing them to locate a student, see the immediate surroundings, and make asset-based instructional decisions.`
    },
    {
      heading: 'The Secondary Challenge',
      body: `In grades 6–12, the terrain becomes exponentially more complex. A single static "Landscape" for all of secondary math becomes an unreadable web of thousands of intersecting lines. Secondary tools often retreat to linear checklists or fragmented pacing guides, losing the interconnectedness that makes math make sense.`
    },
    {
      heading: 'The Solution: A Math Galaxy',
      body: `We scale the Landscape model using interactive web technology. By building a dynamic visualization, we stitch multiple distinct "Landscapes" (Solar Systems) into a single, navigable Math Galaxy. Details appear only when you zoom in; context loads dynamically based on your task.`
    },
    {
      heading: 'The Cosmic Web Model',
      body: `We explicitly reject the "Ladder" model — a single sequential climb of prerequisite skills. Instead, we adopt an Asset-Based Cosmic Web Model:\n\n• Solar Systems (Domains): Secondary math is made of distinct conceptual clusters, each a local Landscape.\n• Gravitational Reinforcement: Mathematical ideas exert a "pull" on each other. A student's understanding of Slope is held in orbit by Proportionality and Geometric Similarity.\n• Astrogation (Navigation): We ask — "Which planet is this student currently standing on? What conceptual gravity is holding them there?"`
    },
    {
      heading: 'How to Navigate',
      body: `1. Select a Task from the sidebar to illuminate the relevant mental actions and spawn student work samples.\n2. Toggle the Teaching Stage (Before/During ↔ After) to switch between planning guidance and reflection/intervention overlays.\n3. Click any node to read its description and connections.\n4. Use Search to locate a specific concept by name.\n5. Click the background to reset all highlighting.`
    },
    {
      heading: 'The 5-Tier Taxonomy',
      body: `🟠 Domains (Solar Systems) — Major content areas spanning grades 6–12\n🔵 Big Ideas (Suns) — Organizing concepts around which everything else orbits\n🟩 Mental Actions (Planets) — Specific ways of thinking, ordered by sophistication\n💠 Samples (Moons) — Student work illustrating a Mental Action; appear when a Task is selected\n📋 Teacher Context (Overlays) — Planning or Reflecting guidance; toggled by the Teaching Stage bar`
    },
  ]
};
