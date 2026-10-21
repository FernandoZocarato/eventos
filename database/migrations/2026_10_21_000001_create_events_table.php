<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('events', function(Blueprint $table) {
   $table->id(); $table->foreignId('user_id')->constrained()->cascadeOnDelete();
   $table->string('title',160); $table->string('category',40); $table->text('description');
   $table->string('location'); $table->string('city',100); $table->dateTime('starts_at'); $table->dateTime('ends_at');
   $table->unsignedInteger('capacity'); $table->string('status',20)->default('draft');
   $table->string('color',20)->default('violet'); $table->timestamps();
   $table->index(['status','starts_at']);
  });
  Schema::create('registrations',function(Blueprint $table) {
   $table->id(); $table->foreignId('event_id')->constrained()->cascadeOnDelete();
   $table->foreignId('user_id')->constrained()->cascadeOnDelete();
   $table->uuid('code')->unique(); $table->timestamp('checked_in_at')->nullable(); $table->timestamps();
   $table->unique(['event_id','user_id']);
  });
 }
 public function down(): void {Schema::dropIfExists('registrations');Schema::dropIfExists('events');}
};
