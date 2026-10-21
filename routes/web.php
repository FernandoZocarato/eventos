<?php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\RegistrationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
Route::prefix('app-api')->group(function() {
 Route::get('session',fn(Request $r)=>response()->json(['user'=>$r->user(),'csrf_token'=>csrf_token()]));
 Route::post('login',[AuthController::class,'login'])->middleware('throttle:5,1');
 Route::post('register',[AuthController::class,'register'])->middleware('throttle:5,1');
 Route::get('events',[EventController::class,'index']);
 Route::get('events/{event}',[EventController::class,'show']);
 Route::middleware('auth')->group(function() {
  Route::post('logout',[AuthController::class,'logout']);
  Route::get('my-events',[EventController::class,'mine']);
  Route::post('events',[EventController::class,'store']);
  Route::put('events/{event}',[EventController::class,'update']);
  Route::get('events/{event}/attendees',[EventController::class,'attendees']);
  Route::post('events/{event}/checkin',[RegistrationController::class,'checkin']);
  Route::get('registrations',[RegistrationController::class,'index']);
  Route::post('events/{event}/registrations',[RegistrationController::class,'store'])->middleware('throttle:20,1');
  Route::delete('registrations/{registration}',[RegistrationController::class,'destroy']);
 });
});
Route::get('/{path?}',fn()=>view('app'))->where('path','^(?!app-api(?:/|$)).*')->name('login');
