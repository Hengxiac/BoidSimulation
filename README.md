# BoidSimulation
Simple Boid Simulation Algorithm based on Typescript

## Prerequisite

* [Typescript compiler](https://www.typescriptlang.org)
* [Web Browser](https://www.microsoft.com/en-us/edge?r=1)

## Build and Run
- Use TypeScript Compiler to compile Typescirpt into JavaScript
- Run Index.html in the browser

## Algorithm
- [Naive Boid Algorithm proposed by Craig Reynolds](http://www.red3d.com/cwr/boids/)

- All calculations are in screen-space
- Framerate ： 60

- There Steps to simulation basic behavior
  - Separation
  - Cohesion
  - Alignment
- Extra steps
  - Limit Speed
  - Steering 
  - Limit Position inside screen
 
- Additional Feature
  - Added Perching Behavior
  
- Tunable Parameters
   - BoidNum - Number of boids in the simulation
   - Separation distance - Min distance for each bird to keep away from other ones (square distance in code while real distance from slider input)
   - Separation Factor - Factor that determines how fast birds would separate
   - Cohesion Distance - Aka visible range for birds, birds within range will form a single flock
   - Cohesion Factor - Parameter that determines how fast birds would fly towards each other
   - Alignment Factor - How fast the orientation and speed will align for birds in the same flock
   - Speed limit - Maximum speed
   - Speed Convergence Factor - How fast will the speed be slowed down
- All the parameter could be tuned in live demo with sliders (in the same order as explained)

- Todo
  - Obstacle Avoidance
  - Wind Field
  - 3D Support
  - Better User Interaface
  
- [Psudocode Reference](http://www.kfish.org/boids/pseudocode.html)
- [Tutorial by Ben Eater](https://eater.net/boids)
