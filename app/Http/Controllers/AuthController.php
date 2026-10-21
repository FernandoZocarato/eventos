<?php
namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Password;
class AuthController extends Controller {
 public function register(Request $request) {
  $data=$request->validate(['name'=>'required|string|max:100','email'=>'required|email|max:255|unique:users','password'=>['required','confirmed',Password::min(8)]]);
  $user=User::create(['name'=>$data['name'],'email'=>$data['email'],'password'=>Hash::make($data['password'])]);
  Auth::login($user);$request->session()->regenerate();return response()->json($user,201);
 }
 public function login(Request $request) {
  $data=$request->validate(['email'=>'required|email','password'=>'required|string']);
  if(!Auth::attempt($data)) throw ValidationException::withMessages(['email'=>'E-mail ou senha incorretos.']);
  $request->session()->regenerate();return response()->json($request->user());
 }
 public function logout(Request $request) {
  Auth::logout();$request->session()->invalidate();$request->session()->regenerateToken();return response()->noContent();
 }
}
