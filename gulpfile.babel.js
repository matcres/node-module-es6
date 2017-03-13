import gulp from 'gulp'
import gulpLoadPlugins from 'gulp-load-plugins'
import path from 'path'
import del from 'del'
import runSequence from 'run-sequence'
import babelCompiler from 'babel-core/register'

const plugins = gulpLoadPlugins()

const paths = {
  js: [
    './**/*.js',
    '!build/**',
    '!node_modules/**',
  ],
  nonJs: [
    // './package.json',
    // './.gitignore',
  ],
  tests: './tests/*.js',
}


// Clean up build
gulp.task('clean', () =>
  del([
    'build/**',
    '!build',
  ])
)

// Set env variables
gulp.task('set-env', () => {
  plugins.env({
    vars: {
      NODE_ENV: 'test',
    },
  })
})

// Lint Javascript
gulp.task('lint', () =>
  gulp.src(paths.js)
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(plugins.eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(plugins.eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(plugins.eslint.failAfterError())
)

// Copy non-js files to build
gulp.task('copy', () =>
  gulp.src(paths.nonJs)
    .pipe(plugins.newer('build'))
    .pipe(gulp.dest('build'))
)

// Compile ES6 to ES5 and copy to build
gulp.task('babel', () =>
  gulp.src([...paths.js, '!gulpfile.babel.js'], { base: '.' }) // eslint-disable-line
    .pipe(plugins.newer('build'))
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.babel())
    .pipe(plugins.sourcemaps.write('.', {
      includeContent: false,
      sourceRoot(file) {
        return path.relative(file.path, __dirname)
      },
    }))
    .pipe(gulp.dest('build'))
)

// Start src with restart on file changes
gulp.task('nodemon', ['lint', 'copy', 'babel'], () => // eslint-disable-line
  plugins.nodemon({
    script: path.join('build', 'index.js'),
    ext: 'js',
    ignore: [
      'node_modules/**/*.js',
      'build/**/*.js',
    ],
    tasks: [
      'lint',
      'copy',
      'babel',
    ],
  })
)


// triggers mocha test
gulp.task('test', ['set-env'], () => { // eslint-disable-line
  // let reporters
  let  exitCode = 0

  return gulp.src([paths.tests], { read: false }) // eslint-disable-line
    .pipe(plugins.plumber())
    .pipe(plugins.mocha({
      reporter: plugins.util.env['mocha-reporter'] || 'spec',
      ui: 'bdd',
      timeout: 6000,
      compilers: {
        js: babelCompiler,
      },
    }))
    .once('error', (err) => {
      plugins.util.log(err)
      exitCode = 1
    })
    .once('end', () => {
      plugins.util.log('completed !!')
      process.exit(exitCode)
    })
})

// clean build, compile js files, copy non-js files and execute tests
gulp.task('mocha', ['clean'], () => { // eslint-disable-line
  runSequence(
    [
      'copy',
      'babel',
    ],
    'test'
  )
})

// gulp serve for development
gulp.task('serve', ['clean'], () => runSequence('nodemon')) // eslint-disable-line

// default task: clean build, compile js files and copy non-js files.
gulp.task('default', ['clean'], () => { // eslint-disable-line
  runSequence(
    [
      'copy',
      'babel',
    ]
  )
})
