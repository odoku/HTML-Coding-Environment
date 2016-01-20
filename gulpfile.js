var gulp         = require("gulp");
var browserify   = require("browserify");
var babelify     = require('babelify');
var source       = require('vinyl-source-stream');
var eslint       = require('gulp-eslint');
var sass         = require('gulp-sass');
var scsslint     = require('gulp-scss-lint');
var autoprefixer = require('gulp-autoprefixer');
var nunjucks     = require('gulp-nunjucks');
var plumber      = require('gulp-plumber');
var runSequence  = require('run-sequence');
var rimraf       = require('rimraf');
var webserver    = require('gulp-webserver');


var conf = {
  babel: {
    src: './src/babel/**/*.es6',
    dist: './build/js/',
    entrypoint: './src/babel/index.es6'
  },
  sass: {
    src: './src/scss/**/*.scss',
    dest: './build/css',
    option: { indentedSyntax: false }
  },
  html: {
    src: ['./src/html/**/*.html', '!./src/html/**/_*.html'],
    watch: './src/html/**/*.html',
    dest: './build/'
  },
  statics: {
    src: './src/static/**/*',
    dest: './build/'
  },
  server: {
    port: 8888
  }
}


// 
// Babel(ECMAScript6) の文法チェック
// ========================================
gulp.task('babel-lint', function() {
  return gulp.src(conf['babel']['src'])
    .pipe(plumber())
    .pipe(eslint({useEslintrc: true}))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});


// 
// Babel(ECMAScript6) をJSにコンパイル
// ========================================
gulp.task('babel-build', ['babel-lint'], function() {
  browserify(conf['babel']['entrypoint'], { debug: true })
    .transform(babelify, {presets: ['es2015']})
    .bundle()
    .on("error", function (err) {
      console.log("Error : " + err.message);
    })
    .pipe(source('index.js'))
    .pipe(gulp.dest(conf['babel']['dist']))
});


// 
// SCSS の文法チェック
// ========================================
gulp.task('sass-lint', function() {
  return gulp.src(conf['sass']['src'])
    .pipe(plumber())
    .pipe(scsslint())
});


// 
// SCSS のコンパイル
// ========================================
gulp.task('sass-build', ['sass-lint'], function() {
  return gulp.src(conf['sass']['src'])
    .pipe(sass(conf['sass']['option']).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(gulp.dest(conf['sass']['dest']))
});


// 
// HTMLテンプレート(nunjucks) のコンパイル
// ========================================
gulp.task('html-build', function() {
  return gulp.src(conf['html']['src'])
    .pipe(plumber())
    .pipe(nunjucks.compile())
    // .pipe(nunjucks.compile({name: 'Sindre'}))
    .pipe(gulp.dest(conf['html']['dest']))
});


// 
// 静的ファイルのコピー
// ========================================
gulp.task('static-copy', function() {
  return gulp.src(conf['statics']['src'])
    .pipe(gulp.dest(conf['statics']['dest']))
})


// 
// 全ビルド & コピータスクの実行
// ========================================
gulp.task('build', function() {
  return runSequence(
    [
      'babel-build',
      'sass-build',
      'html-build',
      'static-copy',
    ]
  );
});


// 
// ファイルが更新されたらビルドを実行
// ========================================
gulp.task('watch', ['build'], function(callback) {
  gulp.watch(conf['babel']['src'], ['babel-build']);
  gulp.watch(conf['sass']['src'], ['sass-build']);
  gulp.watch(conf['html']['watch'], ['html-build']);
  gulp.watch(conf['statics']['src'], ['static-copy']);
});


// 
// コンパイル済みファイルの削除
// ========================================
gulp.task('clean', function(callback) {
  rimraf('./build', callback);
});


// 
// プレビューサーバーの起動
// ========================================
gulp.task('serve', ['build'], function() {
  gulp.src('./build')
    .pipe(webserver({
      livereload: true,
      port: conf['server']['port']
    }));
});


gulp.task('default', ['watch']);
