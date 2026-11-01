  (func (;4693;) (type 0) (param i32)
    (local i32 i32 i32 i32 i32 i64 i64 i64 exnref)
    block (result exnref) ;; label = @1
      global.get 0
      i32.const 480
      i32.sub
      local.tee 1
      global.set 0
      block ;; label = @2
        i32.const 8119572
        i32.load8_u
        i32.const 1
        i32.ne
        br_if 0 (;@2;)
        local.get 0
        i32.load offset=416
        i32.eqz
        br_if 0 (;@2;)
        i32.const 7894220
        i32.load8_u
        i32.const 1
        i32.eq
        if ;; label = @3
          block ;; label = @4
            local.get 0
            i32.const 1104
            i32.add
            local.tee 2
            i32.atomic.load8_u offset=325
            br_if 0 (;@4;)
            local.get 2
            i32.load8_u offset=324
            i32.const 1
            i32.ne
            br_if 0 (;@4;)
            local.get 2
            i32.load8_u offset=312
            i32.const 1
            i32.ne
            br_if 0 (;@4;)
            local.get 2
            i32.load offset=300
            local.tee 3
            i32.eqz
            br_if 0 (;@4;)
            local.get 3
            i32.load8_u offset=1092
            local.set 4
          end
          local.get 4
          i32.const 1
          i32.and
          if ;; label = @4
            block (result i32) ;; label = @5
              i32.const 7889588
              i32.load8_u
              i32.const 1
              i32.eq
              if ;; label = @6
                call 133306
                if ;; label = @7
                  local.get 0
                  i32.load offset=684
                  br 2 (;@5;)
                end
                i32.const 0
                local.get 0
                i32.load8_u offset=680
                i32.const 1
                i32.ne
                br_if 1 (;@5;)
                drop
                local.get 0
                i32.load offset=676
                call 133129
                br 1 (;@5;)
              end
              local.get 0
              i32.load offset=668
            end
            i32.const 0
            i32.ne
            local.set 5
            block (result exnref) ;; label = @5
              global.get 0
              i32.const 224
              i32.sub
              local.tee 0
              global.set 0
              block ;; label = @6
                local.get 2
                i32.load8_u offset=312
                i32.const 1
                i32.ne
                br_if 0 (;@6;)
                local.get 2
                i32.load offset=300
                i32.eqz
                br_if 0 (;@6;)
                local.get 2
                i32.atomic.load8_u offset=325
                i32.const 1
                i32.eq
                if ;; label = @7
                  i32.const 7894320
                  i64.load
                  local.tee 6
                  i32.wrap_i64
                  i32.const 255
                  i32.and
                  i32.const 6
                  i32.lt_u
                  local.get 6
                  i64.const 64512
                  i64.and
                  i64.eqz
                  i32.or
                  br_if 1 (;@6;)
                  local.get 0
                  i32.const 105
                  i32.store offset=36
                  local.get 0
                  i32.const 1244220
                  i32.store offset=32
                  local.get 0
                  local.get 6
                  i64.store offset=72
                  local.get 0
                  local.get 6
                  i64.store offset=40
                  local.get 0
                  i64.const 0
                  i64.store offset=96
                  local.get 0
                  i64.const 0
                  i64.store offset=56
                  local.get 0
                  local.get 0
                  i64.load offset=32 align=4
                  i64.store offset=88
                  local.get 0
                  local.get 0
                  i32.const 176
                  i32.add
                  i32.store offset=64
                  local.get 0
                  local.get 0
                  i64.load offset=64
                  i64.store offset=104
                  local.get 0
                  i32.const 40
                  i32.add
                  i32.const 4
                  local.get 0
                  i32.const 88
                  i32.add
                  local.get 0
                  i32.const 96
                  i32.add
                  i32.const 1
                  call 157492
                  br 1 (;@6;)
                end
                local.get 2
                i32.load offset=300
                i32.load8_u offset=1092
                i32.const 1
                i32.ne
                br_if 0 (;@6;)
                block ;; label = @7
                  block (result exnref) ;; label = @8
                    try_table (catch_all_ref 0 (;@8;)) ;; label = @9
                      block ;; label = @10
                        local.get 2
                        i32.load offset=368
                        local.tee 3
                        i32.const 7
                        i32.gt_u
                        if ;; label = @11
                          try_table (catch_all_ref 6 (;@5;)) ;; label = @12
                            local.get 2
                            i32.const 356
                            i32.add
                            local.get 2
                            i32.load offset=356
                            local.get 3
                            i32.const 2
                            i32.and
                            i32.const 1
                            i32.shr_u
                            select
                            local.get 3
                            i32.const -8
                            i32.and
                            i32.load
                            call_indirect (type 2)
                            local.set 4
                          end
                          local.get 5
                          i32.eqz
                          local.get 4
                          i32.eqz
                          i32.or
                          br_if 5 (;@6;)
                          local.get 2
                          i32.load8_u offset=324
                          i32.eqz
                          if ;; label = @12
                            i32.const 7894320
                            i64.load
                            local.tee 6
                            i32.wrap_i64
                            local.tee 2
                            i32.const 8
                            i32.shr_u
                            i32.const 255
                            i32.and
                            i32.const 3
                            i32.lt_u
                            local.get 2
                            i32.const 255
                            i32.and
                            i32.const 6
                            i32.lt_u
                            i32.or
                            br_if 6 (;@6;)
                            local.get 0
                            i32.const 1129474
                            i32.store offset=32
                            local.get 0
                            i32.const 113
                            i32.store offset=36
                            local.get 0
                            local.get 6
                            i64.store offset=72
                            local.get 0
                            local.get 6
                            i64.store offset=112
                            local.get 0
                            i64.const 0
                            i64.store offset=136
                            local.get 0
                            i64.const 0
                            i64.store offset=56
                            local.get 0
                            local.get 0
                            i64.load offset=32 align=4
                            i64.store offset=48
                            local.get 0
                            local.get 0
                            i32.const 176
                            i32.add
                            i32.store offset=64
                            local.get 0
                            local.get 0
                            i64.load offset=64
                            i64.store offset=144
                            try_table (catch_all_ref 7 (;@5;)) ;; label = @13
                              local.get 0
                              i32.const 112
                              i32.add
                              i32.const 3
                              local.get 0
                              i32.const 48
                              i32.add
                              local.get 0
                              i32.const 136
                              i32.add
                              i32.const 1
                              call 157492
                            end
                            br 6 (;@6;)
                          end
                          try_table (catch_all_ref 6 (;@5;)) ;; label = @12
                            local.get 2
                            i32.const 308
                            i32.add
                            call 157578
                          end
                          local.get 2
                          i32.load offset=300
                          local.set 3
                          local.get 2
                          i32.const 0
                          i32.store offset=300
                          local.get 0
                          local.get 3
                          i32.store offset=200
                          local.get 2
                          i32.load offset=304
                          local.set 3
                          local.get 2
                          i32.const 0
                          i32.store offset=304
                          local.get 0
                          local.get 3
                          i32.store offset=204
                          local.get 0
                          i32.const 56
                          i32.add
                          call 1983
                          local.get 0
                          i32.const 26
                          i32.store offset=156
                          local.get 0
                          i32.const 708829
                          i32.store offset=152
                          local.get 0
                          i32.load offset=56
                          local.set 3
                          local.get 0
                          local.get 0
                          i64.load offset=152 align=4
                          i64.store offset=216
                          block (result exnref) ;; label = @12
                            try_table (catch_all_ref 0 (;@12;)) ;; label = @13
                              local.get 3
                              local.get 0
                              i32.const 216
                              i32.add
                              call 1989
                              br 3 (;@10;)
                            end
                            unreachable
                          end
                          local.get 0
                          global.set 0
                          local.get 0
                          i32.const 56
                          i32.add
                          call 168019
                          drop
                          throw_ref
                        end
                        try_table (catch_all_ref 5 (;@5;)) ;; label = @11
                          i32.const 4
                          call 164519
                          local.tee 0
                          i32.const 7847864
                          i32.store
                          local.get 0
                          i32.const 7847876
                          i32.const 18
                          call 164524
                        end
                        unreachable
                      end
                      local.get 0
                      i32.const 56
                      i32.add
                      call 168019
                      drop
                      global.get 0
                      i32.const 32
                      i32.sub
                      local.tee 3
                      global.set 0
                      block ;; label = @10
                        local.get 2
                        i32.load8_u offset=312
                        i32.const 1
                        i32.ne
                        br_if 0 (;@10;)
                        local.get 3
                        i32.const 24
                        i32.add
                        call 1983
                        local.get 3
                        i32.const 35
                        i32.const 22
                        local.get 2
                        i32.load8_u offset=299
                        local.tee 5
                        select
                        i32.store offset=12
                        local.get 3
                        i32.const 1408579
                        i32.const 1869867
                        local.get 5
                        select
                        i32.store offset=8
                        local.get 3
                        i32.load offset=24
                        local.set 5
                        local.get 3
                        local.get 3
                        i64.load offset=8 align=4
                        i64.store offset=16
                        block ;; label = @11
                          block (result exnref) ;; label = @12
                            try_table (catch_all_ref 0 (;@12;)) ;; label = @13
                              local.get 5
                              local.get 3
                              i32.const 16
                              i32.add
                              call 1989
                              br 2 (;@11;)
                            end
                            unreachable
                          end
                          local.get 3
                          global.set 0
                          local.get 3
                          i32.const 24
                          i32.add
                          call 168019
                          drop
                          throw_ref
                        end
                        local.get 3
                        i32.load offset=28
                        local.tee 5
                        i32.eqz
                        br_if 0 (;@10;)
                        local.get 5
                        i32.const -1
                        i32.atomic.rmw.add offset=4
                        br_if 0 (;@10;)
                        local.get 5
                        local.get 5
                        i32.load
                        i32.load offset=8
                        call_indirect (type 0)
                        local.get 5
                        call 164173
                      end
                      local.get 3
                      i32.const 32
                      i32.add
                      global.set 0
                      local.get 2
                      i32.load8_u offset=312
                      i32.const 1
                      i32.eq
                      if ;; label = @10
                        global.get 0
                        local.set 3
                        block ;; label = @11
                          block ;; label = @12
                            try_table (catch_all 0 (;@12;)) ;; label = @13
                              local.get 2
                              i32.const 308
                              i32.add
                              call 157578
                              br 2 (;@11;)
                            end
                            unreachable
                          end
                          local.get 3
                          global.set 0
                          call 164531
                          unreachable
                        end
                        block ;; label = @11
                          local.get 2
                          i32.load offset=308
                          local.tee 3
                          i32.eqz
                          br_if 0 (;@11;)
                          local.get 3
                          i32.const 1
                          i32.atomic.rmw.sub offset=4
                          i32.const 1
                          i32.ne
                          br_if 0 (;@11;)
                          local.get 3
                          call 157573
                        end
                        block ;; label = @11
                          local.get 2
                          i32.load offset=304
                          local.tee 3
                          i32.eqz
                          br_if 0 (;@11;)
                          local.get 3
                          i32.const -1
                          i32.atomic.rmw.add offset=4
                          br_if 0 (;@11;)
                          local.get 3
                          local.get 3
                          i32.load
                          i32.load offset=8
                          call_indirect (type 0)
                          local.get 3
                          call 164173
                        end
                        local.get 2
                        call 2020
                        local.get 2
                        i32.const 0
                        i32.store8 offset=312
                      end
                      i32.const 7894320
                      i64.load
                      local.tee 6
                      i32.wrap_i64
                      i32.const 255
                      i32.and
                      i32.const 6
                      i32.lt_u
                      local.get 6
                      i64.const 64512
                      i64.and
                      i64.eqz
                      i32.or
                      i32.eqz
                      if ;; label = @10
                        local.get 0
                        local.get 6
                        i64.store offset=72
                        local.get 0
                        i32.const 84
                        i32.store offset=36
                        local.get 0
                        i32.const 1839872
                        i32.store offset=32
                        local.get 0
                        i64.const 0
                        i64.store offset=56
                        local.get 0
                        local.get 0
                        i32.const 176
                        i32.add
                        i32.store offset=64
                        local.get 0
                        local.get 0
                        i64.load offset=72
                        i64.store offset=208
                        local.get 0
                        local.get 0
                        i64.load offset=32 align=4
                        i64.store offset=192
                        local.get 0
                        local.get 0
                        v128.load offset=56 align=8
                        v128.store offset=16 align=8
                        local.get 0
                        i32.const 208
                        i32.add
                        i32.const 4
                        local.get 0
                        i32.const 192
                        i32.add
                        local.get 0
                        i32.const 16
                        i32.add
                        i32.const 1
                        call 157492
                      end
                      local.get 2
                      i32.const 332
                      i32.add
                      local.tee 3
                      call 4922
                      local.get 3
                      i32.const 2
                      i32.const 1129790
                      call 4923
                      local.get 0
                      i64.load offset=200 align=4
                      local.set 6
                      local.get 0
                      i64.const 0
                      i64.store offset=200 align=4
                      local.get 0
                      local.get 6
                      i64.store offset=80 align=4
                      local.get 0
                      local.get 0
                      i64.load offset=80 align=4
                      i64.store offset=8
                      local.get 2
                      i32.const 404
                      i32.add
                      local.get 0
                      i32.const 8
                      i32.add
                      call 4904
                      local.get 0
                      i32.const 0
                      i32.store offset=132
                      block ;; label = @10
                        block (result exnref) ;; label = @11
                          try_table (catch_all_ref 0 (;@11;)) ;; label = @12
                            local.get 4
                            i32.const 0
                            i32.const 0
                            local.get 0
                            i32.const 120
                            i32.add
                            local.get 4
                            i32.load
                            i32.load offset=60
                            call_indirect (type 6)
                            br 2 (;@10;)
                          end
                          unreachable
                        end
                        local.get 0
                        global.set 0
                        local.get 0
                        i32.const 120
                        i32.add
                        call 166829
                        throw_ref
                      end
                      local.get 0
                      i32.const 120
                      i32.add
                      call 166829
                      local.get 2
                      i32.const 420
                      i32.add
                      i32.const 4
                      call 166914
                      local.get 0
                      i32.const 0
                      i32.store offset=168
                      local.get 0
                      i64.const 0
                      i64.store offset=160
                      local.get 4
                      i32.load
                      local.set 2
                      local.get 0
                      i32.const 2895794
                      i32.store offset=172
                      block (result exnref) ;; label = @10
                        try_table (catch_all_ref 0 (;@10;)) ;; label = @11
                          local.get 4
                          i32.const 1
                          local.get 0
                          i32.const 160
                          i32.add
                          local.get 2
                          i32.load offset=36
                          call_indirect (type 3)
                          br 4 (;@7;)
                        end
                        unreachable
                      end
                      local.get 0
                      global.set 0
                      local.get 0
                      i32.const 160
                      i32.add
                      call 166829
                      throw_ref
                    end
                    unreachable
                  end
                  local.get 0
                  global.set 0
                  local.get 0
                  i32.const 200
                  i32.add
                  call 168019
                  drop
                  throw_ref
                end
                local.get 0
                i32.const 160
                i32.add
                call 166829
                local.get 0
                i32.const 200
                i32.add
                call 168019
                drop
              end
              local.get 0
              i32.const 224
              i32.add
              global.set 0
              br 3 (;@2;)
            end
            throw_ref
          end
          local.get 1
          i32.const 3945
          i32.store offset=472
          local.get 1
          local.get 0
          i32.store offset=88
          local.get 1
          local.get 1
          i32.const 88
          i32.add
          i32.store offset=476
          local.get 1
          local.get 1
          i64.load offset=472 align=4
          i64.store offset=456
          local.get 1
          i32.const 456
          i32.add
          local.set 3
          global.get 0
          i32.const 448
          i32.sub
          local.tee 0
          global.set 0
          block ;; label = @4
            local.get 2
            i32.load8_u offset=312
            i32.const 1
            i32.ne
            br_if 0 (;@4;)
            local.get 2
            i32.load8_u offset=297
            i32.const 1
            i32.and
            i32.eqz
            br_if 0 (;@4;)
            local.get 2
            i32.load8_u offset=298
            i32.const 1
            i32.and
            br_if 0 (;@4;)
            local.get 2
            i32.atomic.load8_u offset=325
            br_if 0 (;@4;)
            i32.const 7894320
            i64.load
            local.tee 6
            i32.wrap_i64
            local.set 4
            local.get 2
            i32.load8_u offset=324
            i32.eqz
            if ;; label = @5
              local.get 4
              i32.const 255
              i32.and
              i32.const 6
              i32.lt_u
              local.get 6
              i64.const 8
              i64.shr_u
              i32.wrap_i64
              i32.const 255
              i32.and
              i32.const 3
              i32.lt_u
              i32.or
              br_if 1 (;@4;)
              local.get 0
              i32.const 121
              i32.store offset=436
              local.get 0
              i32.const 1489662
              i32.store offset=432
              local.get 0
              local.get 6
              i64.store offset=384
              local.get 0
              local.get 6
              i64.store offset=400
              local.get 0
              i64.const 0
              i64.store offset=408
              local.get 0
              i64.const 0
              i64.store offset=88
              local.get 0
              local.get 0
              i64.load offset=432 align=4
              i64.store offset=40
              local.get 0
              local.get 0
              i32.store offset=96
              local.get 0
              local.get 0
              i64.load offset=96
              i64.store offset=416
              local.get 0
              i32.const 400
              i32.add
              i32.const 3
              local.get 0
              i32.const 40
              i32.add
              local.get 0
              i32.const 408
              i32.add
              i32.const 1
              call 157492
              br 1 (;@4;)
            end
            local.get 6
            i64.const 64512
            i64.and
            i64.eqz
            local.get 4
            i32.const 255
            i32.and
            i32.const 6
            i32.lt_u
            i32.or
            i32.eqz
            if ;; label = @5
              local.get 0
              i32.const 83
              i32.store offset=436
              local.get 0
              i32.const 1933309
              i32.store offset=432
              local.get 0
              local.get 6
              i64.store offset=384
              local.get 0
              local.get 6
              i64.store offset=440
              local.get 0
              i64.const 0
              i64.store offset=24
              local.get 0
              i64.const 0
              i64.store offset=88
              local.get 0
              local.get 0
              i64.load offset=432 align=4
              i64.store offset=64
              local.get 0
              local.get 0
              i32.store offset=96
              local.get 0
              local.get 0
              i64.load offset=96
              i64.store offset=32
              local.get 0
              i32.const 440
              i32.add
              i32.const 4
              local.get 0
              i32.const -64
              i32.sub
              local.get 0
              i32.const 24
              i32.add
              i32.const 1
              call 157492
            end
            local.get 2
            i32.const 1964834
            i32.const 4
            call 4902
            call 163594
            local.set 7
            local.get 0
            i32.const 88
            i32.add
            local.get 2
            call 430
            local.set 2
            block ;; label = @5
              block (result exnref) ;; label = @6
                try_table (catch_all_ref 0 (;@6;)) ;; label = @7
                  local.get 3
                  i32.load offset=4
                  local.get 2
                  local.get 3
                  i32.load
                  call_indirect (type 1)
                  i32.const 7894320
                  i64.load
                  local.tee 6
                  i64.const 64512
                  i64.and
                  i64.eqz
                  local.get 6
                  i32.wrap_i64
                  i32.const 255
                  i32.and
                  i32.const 6
                  i32.lt_u
                  i32.or
                  br_if 2 (;@5;)
                  call 163594
                  local.set 8
                  local.get 0
                  local.get 6
                  i64.store offset=432
                  local.get 0
                  i32.const 157
                  i32.store offset=52
                  local.get 0
                  i32.const 325899
                  i32.store offset=48
                  local.get 0
                  i64.const 3
                  i64.store
                  local.get 0
                  local.get 8
                  local.get 7
                  i64.sub
                  i64.const 1000000
                  i64.div_s
                  i64.store offset=384
                  local.get 0
                  local.get 0
                  i32.const 384
                  i32.add
                  i32.store offset=8
                  local.get 0
                  local.get 0
                  i64.load offset=432
                  i64.store offset=424
                  local.get 0
                  local.get 0
                  i64.load offset=48 align=4
                  i64.store offset=56
                  local.get 0
                  local.get 0
                  v128.load align=8
                  v128.store offset=72 align=8
                  local.get 0
                  i32.const 424
                  i32.add
                  i32.const 4
                  local.get 0
                  i32.const 56
                  i32.add
                  local.get 0
                  i32.const 72
                  i32.add
                  i32.const 1
                  call 157492
                  br 2 (;@5;)
                end
                unreachable
              end
              local.get 0
              global.set 0
              local.get 2
              call 2020
              throw_ref
            end
            local.get 2
            call 2020
          end
          local.get 0
          i32.const 448
          i32.add
          global.set 0
          br 1 (;@2;)
        end
        block ;; label = @3
          local.get 0
          i32.load8_u offset=1096
          local.tee 2
          i32.const 1
          i32.and
          i32.eqz
          local.get 0
          i32.load8_u offset=1552
          i32.const 1
          i32.ne
          i32.or
          i32.eqz
          if ;; label = @4
            local.get 0
            i32.load offset=1084
            local.tee 2
            i32.eqz
            br_if 1 (;@3;)
            local.get 2
            i32.load8_u offset=1092
            i32.const 1
            i32.ne
            br_if 1 (;@3;)
            local.get 0
            call 4756
            br 2 (;@2;)
          end
          local.get 2
          i32.const 1
          i32.and
          i32.eqz
          br_if 1 (;@2;)
        end
        local.get 0
        i32.load8_u offset=1081
        i32.const 1
        i32.ne
        br_if 0 (;@2;)
        local.get 0
        i32.load8_u offset=1082
        br_if 0 (;@2;)
        local.get 0
        i32.atomic.load8_u offset=1553
        br_if 0 (;@2;)
        i32.const 7894128
        i64.load
        local.tee 6
        i32.wrap_i64
        local.set 2
        local.get 0
        i32.load8_u offset=1552
        i32.eqz
        if ;; label = @3
          local.get 2
          i32.const 8
          i32.shr_u
          i32.const 255
          i32.and
          i32.const 3
          i32.lt_u
          local.get 2
          i32.const 255
          i32.and
          i32.const 6
          i32.lt_u
          i32.or
          br_if 1 (;@2;)
          local.get 0
          i32.load offset=700
          local.set 0
          local.get 1
          local.get 6
          i64.store offset=432
          local.get 1
          i32.const 140
          i32.store offset=388
          local.get 1
          i32.const 2652735
          i32.store offset=384
          local.get 1
          local.get 6
          i64.store offset=424
          local.get 1
          i64.const 14
          i64.store offset=72
          local.get 1
          i64.const 14
          i64.store offset=88
          local.get 1
          local.get 0
          i32.store offset=48
          local.get 1
          local.get 1
          i64.load offset=384 align=4
          i64.store offset=416
          local.get 1
          local.get 1
          i32.const 48
          i32.add
          i32.store offset=96
          local.get 1
          local.get 1
          i64.load offset=96
          i64.store offset=80
          local.get 1
          i32.const 424
          i32.add
          i32.const 3
          local.get 1
          i32.const 416
          i32.add
          local.get 1
          i32.const 72
          i32.add
          i32.const 1
          call 157492
          br 1 (;@2;)
        end
        local.get 6
        i64.const 64512
        i64.and
        i64.eqz
        local.get 2
        i32.const 255
        i32.and
        i32.const 6
        i32.lt_u
        i32.or
        i32.eqz
        if ;; label = @3
          local.get 0
          i32.load offset=700
          local.set 2
          local.get 1
          local.get 6
          i64.store offset=432
          local.get 1
          i32.const 94
          i32.store offset=388
          local.get 1
          i32.const 2652507
          i32.store offset=384
          local.get 1
          local.get 6
          i64.store offset=448
          local.get 1
          i64.const 14
          i64.store offset=32
          local.get 1
          i64.const 14
          i64.store offset=88
          local.get 1
          local.get 2
          i32.store offset=48
          local.get 1
          local.get 1
          i64.load offset=384 align=4
          i64.store offset=392
          local.get 1
          local.get 1
          i32.const 48
          i32.add
          i32.store offset=96
          local.get 1
          local.get 1
          i64.load offset=96
          i64.store offset=40
          local.get 1
          i32.const 448
          i32.add
          i32.const 4
          local.get 1
          i32.const 392
          i32.add
          local.get 1
          i32.const 32
          i32.add
          i32.const 1
          call 157492
        end
        local.get 0
        i32.const 784
        i32.add
        local.set 2
        local.get 0
        i32.const 1964834
        i32.const 4
        call 4673
        call 163594
        local.set 7
        block ;; label = @3
          block (result exnref) ;; label = @4
            try_table (catch_all_ref 0 (;@4;)) ;; label = @5
              try_table (catch_all_ref 4 (;@1;)) ;; label = @6
                local.get 0
                i32.const 700
                i32.add
                local.set 3
                local.get 1
                i32.const 88
                i32.add
                local.get 2
                call 430
                local.set 2
              end
              local.get 0
              local.get 3
              local.get 2
              call 4672
              i32.const 7894128
              i64.load
              local.tee 6
              i64.const 64512
              i64.and
              i64.eqz
              local.get 6
              i32.wrap_i64
              i32.const 255
              i32.and
              i32.const 6
              i32.lt_u
              i32.or
              br_if 2 (;@3;)
              call 163594
              local.set 8
              local.get 1
              local.get 6
              i64.store offset=384
              local.get 1
              i32.const 161
              i32.store offset=404
              local.get 1
              i32.const 326057
              i32.store offset=400
              local.get 1
              i64.const 3
              i64.store offset=48
              local.get 1
              local.get 8
              local.get 7
              i64.sub
              i64.const 1000000
              i64.div_s
              i64.store offset=432
              local.get 1
              local.get 1
              i32.const 432
              i32.add
              i32.store offset=56
              local.get 1
              local.get 1
              i64.load offset=384
              i64.store offset=408
              local.get 1
              local.get 1
              i64.load offset=400 align=4
              i64.store offset=464
              local.get 1
              local.get 1
              v128.load offset=48 align=8
              v128.store offset=16 align=8
              local.get 1
              i32.const 408
              i32.add
              i32.const 4
              local.get 1
              i32.const 464
              i32.add
              local.get 1
              i32.const 16
              i32.add
              i32.const 1
              call 157492
              br 2 (;@3;)
            end
            unreachable
          end
          local.get 1
          global.set 0
          local.get 2
          call 2020
          throw_ref
        end
        local.get 2
        call 2020
      end
      local.get 1
      i32.const 480
      i32.add
      global.set 0
      return
    end
    throw_ref
  )
  (func (;11508;) (type 2) (param i32) (result i32)
    (local i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i64 i64)
    block (result exnref) ;; label = @1
      global.get 0
      i32.const 960
      i32.sub
      local.tee 1
      global.set 0
      local.get 1
      i32.const 23931556
      i32.load
      i32.store offset=956
      local.get 0
      i32.const 2981384
      i32.store
      block ;; label = @2
        try_table (catch_all 0 (;@2;)) ;; label = @3
          local.get 1
          i32.const 616
          i32.add
          i32.const -1
          i32.const 0
          call 151790
          local.tee 4
          i32.const 1671588
          local.get 0
          i32.load offset=12
          f32.load offset=13416
          f64.promote_f32
          call 151757
          local.get 4
          i32.const 574738
          local.get 0
          i32.load offset=120
          i32.load offset=48
          call 151815
          i32.const 32
          call 166572
          local.tee 2
          i32.const 0
          i32.store8 offset=29
          local.get 2
          i32.const 701778
          i64.load align=1
          i64.store offset=21 align=1
          local.get 2
          i32.const 701773
          i64.load align=1
          i64.store offset=16 align=1
          local.get 2
          i32.const 701757
          v128.load align=1
          v128.store align=1
          local.get 1
          i64.const -9223371899415822307
          i64.store offset=372 align=4
          local.get 1
          local.get 2
          i32.store offset=368
          local.get 4
          local.get 1
          i32.const 368
          i32.add
          i32.const 7912004
          i32.load
          i32.const 0
          call 151811
          local.get 1
          i32.load8_s offset=379
          i32.const 0
          i32.lt_s
          if ;; label = @4
            local.get 1
            i32.load offset=376
            drop
            local.get 1
            i32.load offset=368
            call 166574
          end
          local.get 4
          call 2005
          local.get 1
          i32.const 368
          i32.add
          i32.const -1
          i32.const 0
          call 151790
          local.set 4
          local.get 0
          i32.load offset=120
          i32.load offset=52
          local.set 2
          local.get 4
          i32.const 2003745
          local.get 0
          i32.load8_u offset=80
          call 151765
          local.get 4
          i32.const 859644
          local.get 2
          call 151809
          local.get 4
          i32.const 858649
          local.get 0
          i32.load offset=84
          call 151815
          local.get 4
          i32.const 568663
          local.get 0
          i32.load offset=84
          local.tee 3
          if (result i32) ;; label = @4
            local.get 2
            f32.convert_i32_u
            f32.const 0x1.f4p+9 (;=1000;)
            f32.mul
            local.get 3
            f32.convert_i32_u
            f32.div
            i32.trunc_sat_f32_s
          else
            i32.const 1000
          end
          call 151810
          local.get 4
          i32.const 1947617
          local.get 0
          i32.load offset=120
          i32.load offset=60
          call 151815
          local.get 4
          i32.const 1947413
          local.get 0
          i32.load offset=120
          i32.load offset=64
          call 151815
          local.get 4
          i32.const 1817287
          local.get 2
          if (result f64) ;; label = @4
            local.get 0
            i32.load offset=120
            i32.load offset=60
            f32.convert_i32_u
            local.get 2
            f32.convert_i32_u
            f32.div
            f64.promote_f32
          else
            f64.const 0x0p+0 (;=0;)
          end
          call 151757
          local.get 4
          i32.const 1817318
          local.get 2
          if (result f64) ;; label = @4
            local.get 0
            i32.load offset=120
            i32.load offset=64
            f32.convert_i32_u
            local.get 2
            f32.convert_i32_u
            f32.div
            f64.promote_f32
          else
            f64.const 0x0p+0 (;=0;)
          end
          call 151757
          local.get 4
          i32.const 1817634
          local.get 0
          i32.load offset=84
          local.tee 3
          if (result f64) ;; label = @4
            local.get 0
            i32.load offset=120
            i32.load offset=60
            f32.convert_i32_u
            local.get 3
            f32.convert_i32_u
            f32.div
            f64.promote_f32
          else
            f64.const 0x0p+0 (;=0;)
          end
          call 151757
          local.get 4
          i32.const 1817673
          local.get 0
          i32.load offset=84
          local.tee 3
          if (result f64) ;; label = @4
            local.get 0
            i32.load offset=120
            i32.load offset=64
            f32.convert_i32_u
            local.get 3
            f32.convert_i32_u
            f32.div
            f64.promote_f32
          else
            f64.const 0x0p+0 (;=0;)
          end
          call 151757
          local.get 1
          i32.const 32
          call 166572
          local.tee 3
          i32.store offset=616
          local.get 3
          i32.const 1490418
          i64.load align=1
          i64.store offset=21 align=1
          local.get 3
          i32.const 1490413
          i64.load align=1
          i64.store offset=16 align=1
          local.get 3
          i32.const 1490397
          v128.load align=1
          v128.store align=1
          local.get 1
          i32.const 29
          i32.store offset=620
          i32.const 7912016
          i32.load
          local.set 5
          local.get 3
          i32.const 0
          i32.store8 offset=29
          local.get 1
          i32.const -2147483616
          i32.store offset=624
          local.get 4
          local.get 1
          i32.const 616
          i32.add
          local.get 5
          i32.const 0
          call 151811
          local.get 1
          i32.load8_s offset=627
          i32.const 0
          i32.lt_s
          if ;; label = @4
            local.get 1
            i32.load offset=624
            drop
            local.get 1
            i32.load offset=616
            call 166574
          end
          i32.const 7911992
          i32.load
          i32.const 0
          i32.gt_s
          if ;; label = @4
            local.get 1
            i32.const 616
            i32.add
            i32.const 17898392
            call 1189
            local.tee 5
            call 1493
            i32.eqz
            if ;; label = @5
              local.get 1
              i32.const 0
              i32.store8 offset=116
              local.get 1
              i32.const 0
              i32.store8 offset=127
              local.get 5
              i32.const -64
              i32.sub
              local.tee 3
              local.get 1
              i32.const 116
              i32.add
              call 1152
              local.get 1
              i32.load8_s offset=127
              i32.const 0
              i32.lt_s
              if ;; label = @6
                local.get 1
                i32.load offset=124
                drop
                local.get 1
                i32.load offset=116
                call 166574
              end
              local.get 3
              call 1148
              local.get 1
              i32.const 17
              i32.store offset=52
              local.get 1
              i32.const 859644
              i32.store offset=48
              local.get 1
              local.get 1
              i64.load offset=48 align=4
              i64.store offset=40
              local.get 3
              local.get 1
              i32.const 40
              i32.add
              local.get 2
              i64.extend_i32_u
              i32.const 1
              call 978
              local.get 1
              i32.const 24
              i32.store offset=308
              local.get 1
              i32.const 858649
              i32.store offset=304
              local.get 0
              i64.load32_u offset=84
              local.set 12
              local.get 1
              local.get 1
              i64.load offset=304 align=4
              i64.store offset=296
              local.get 3
              local.get 1
              i32.const 296
              i32.add
              local.get 12
              i32.const 1
              call 978
              local.get 1
              i32.const 1947617
              i32.store offset=108
              local.get 0
              i32.load offset=120
              i64.load32_u offset=60
              local.set 12
              local.get 1
              i32.const 24
              i32.store offset=112
              local.get 1
              local.get 1
              i64.load offset=108 align=4
              i64.store offset=88
              local.get 3
              local.get 1
              i32.const 88
              i32.add
              local.get 12
              i32.const 1
              call 978
              local.get 0
              i32.load offset=120
              local.get 1
              i32.const 26
              i32.store offset=84
              local.get 1
              i32.const 1947413
              i32.store offset=80
              i64.load32_u offset=64
              local.set 12
              local.get 1
              local.get 1
              i64.load offset=80 align=4
              i64.store offset=216
              local.get 3
              local.get 1
              i32.const 216
              i32.add
              local.get 12
              i32.const 1
              call 978
              local.get 5
              call 1488
            end
            local.get 5
            i32.const 2852528
            call 1478
            drop
          end
          i32.const 7911980
          i32.load
          i32.const 0
          i32.gt_s
          if ;; label = @4
            local.get 0
            i32.load offset=48
            local.set 3
            local.get 0
            i32.load offset=120
            local.tee 2
            i32.load offset=16
            local.set 5
            local.get 0
            i32.load offset=60
            local.set 6
            local.get 2
            i32.load offset=28
            local.set 7
            local.get 2
            i32.load
            local.set 8
            local.get 2
            i32.load offset=44
            local.set 9
            local.get 2
            i32.load offset=12
            local.set 10
            local.get 2
            i32.load offset=32
            local.set 11
            local.get 1
            i32.const 616
            i32.add
            i32.const -1
            i32.const 0
            call 151790
            local.tee 2
            i32.const 688418
            local.get 0
            i32.load offset=120
            i32.load offset=52
            local.get 3
            local.get 5
            i32.add
            local.tee 3
            local.get 8
            local.get 11
            i32.add
            i32.add
            i32.sub
            call 151815
            local.get 2
            i32.const 1332883
            local.get 0
            i32.load offset=120
            i32.load offset=52
            local.get 3
            i32.sub
            call 151815
            local.get 2
            i32.const 688431
            local.get 0
            i32.load offset=120
            i32.load offset=48
            local.get 6
            local.get 7
            i32.add
            local.tee 3
            local.get 9
            local.get 10
            i32.add
            i32.add
            i32.sub
            call 151815
            local.get 2
            i32.const 1333146
            local.get 0
            i32.load offset=120
            i32.load offset=48
            local.get 3
            i32.sub
            call 151815
            i32.const 40
            call 166572
            local.set 3
            local.get 1
            i32.const 39
            i32.store offset=120
            local.get 1
            local.get 3
            i32.store offset=116
            i32.const 7911980
            i32.load
            local.set 5
            local.get 3
            i32.const 0
            i32.store8 offset=39
            local.get 1
            i32.const -2147483608
            i32.store offset=124
            local.get 3
            i32.const 342075
            i64.load align=1
            i64.store offset=31 align=1
            local.get 3
            i32.const 342060
            v128.load align=1
            v128.store offset=16 align=1
            local.get 3
            i32.const 342044
            v128.load align=1
            v128.store align=1
            local.get 2
            local.get 1
            i32.const 116
            i32.add
            local.get 5
            i32.const 0
            call 151811
            local.get 1
            i32.load8_s offset=127
            i32.const 0
            i32.lt_s
            if ;; label = @5
              local.get 1
              i32.load offset=124
              drop
              local.get 1
              i32.load offset=116
              call 166574
            end
            local.get 2
            call 2005
          end
          i32.const 8059488
          i64.load align=4
          local.tee 12
          i32.wrap_i64
          local.set 2
          local.get 12
          i64.const 8
          i64.shr_u
          i32.wrap_i64
          local.tee 3
          i32.const 255
          i32.and
          i32.const 3
          i32.lt_u
          local.get 2
          i32.const 255
          i32.and
          i32.const 6
          i32.lt_u
          i32.or
          i32.eqz
          if ;; label = @4
            local.get 1
            local.get 12
            i64.store offset=336
            local.get 0
            i32.load offset=120
            local.tee 2
            i64.load offset=4 align=4
            local.set 12
            local.get 2
            i32.load offset=12
            local.set 3
            local.get 1
            local.get 2
            i32.load
            i32.store offset=192
            local.get 1
            local.get 3
            i32.store offset=196
            local.get 1
            local.get 12
            i64.store offset=200
            local.get 1
            local.get 1
            i64.load offset=336
            i64.store offset=160
            local.get 1
            i32.const 160
            i32.add
            i32.const 2032526
            local.get 1
            i32.const 192
            i32.add
            call 157497
            i32.const 8059488
            i64.load align=4
            local.tee 12
            i64.const 8
            i64.shr_u
            i32.wrap_i64
            local.set 3
            local.get 12
            i32.wrap_i64
            local.set 2
          end
          local.get 2
          i32.const 255
          i32.and
          i32.const 6
          i32.lt_u
          local.get 3
          i32.const 255
          i32.and
          i32.const 3
          i32.lt_u
          i32.or
          i32.eqz
          if ;; label = @4
            local.get 1
            local.get 12
            i64.store offset=64
            local.get 0
            i32.load offset=120
            local.tee 2
            i64.load offset=20 align=4
            local.set 12
            local.get 2
            i32.load offset=28
            local.set 3
            local.get 1
            local.get 2
            i32.load offset=16
            i32.store offset=176
            local.get 1
            local.get 3
            i32.store offset=180
            local.get 1
            local.get 12
            i64.store offset=184
            local.get 1
            local.get 1
            i64.load offset=64
            i64.store offset=344
            local.get 1
            i32.const 344
            i32.add
            i32.const 2032358
            local.get 1
            i32.const 176
            i32.add
            call 157497
            i32.const 8059488
            i64.load align=4
            local.tee 12
            i64.const 8
            i64.shr_u
            i32.wrap_i64
            local.set 3
            local.get 12
            i32.wrap_i64
            local.set 2
          end
          local.get 3
          i32.const 255
          i32.and
          i32.const 3
          i32.lt_u
          local.get 2
          i32.const 255
          i32.and
          i32.const 6
          i32.lt_u
          i32.or
          if (result i32) ;; label = @4
            local.get 2
          else
            local.get 1
            local.get 12
            i64.store offset=96
            local.get 0
            i32.load offset=120
            local.tee 2
            i64.load offset=36 align=4
            local.set 12
            local.get 2
            i32.load offset=44
            local.set 3
            local.get 1
            local.get 2
            i32.load offset=32
            i32.store offset=352
            local.get 1
            local.get 3
            i32.store offset=356
            local.get 1
            local.get 12
            i64.store offset=360
            local.get 1
            local.get 1
            i64.load offset=96
            i64.store offset=56
            local.get 1
            i32.const 56
            i32.add
            i32.const 2032198
            local.get 1
            i32.const 352
            i32.add
            call 157497
            i32.const 8059488
            i64.load align=4
            local.tee 12
            i64.const 8
            i64.shr_u
            i32.wrap_i64
            local.set 3
            local.get 12
            i32.wrap_i64
          end
          i32.const 255
          i32.and
          i32.const 6
          i32.lt_u
          local.get 3
          i32.const 255
          i32.and
          i32.const 3
          i32.lt_u
          i32.or
          i32.eqz
          if ;; label = @4
            local.get 1
            local.get 12
            i64.store
            local.get 0
            i64.load offset=52 align=4
            local.set 12
            local.get 0
            i32.load offset=60
            local.set 2
            local.get 0
            i32.load offset=48
            local.set 3
            local.get 1
            local.get 0
            i32.load offset=120
            f32.load offset=72
            f64.promote_f32
            f64.store offset=240
            local.get 1
            local.get 3
            i32.store offset=224
            local.get 1
            local.get 2
            i32.store offset=228
            local.get 1
            local.get 12
            i64.store offset=232
            local.get 1
            local.get 1
            i64.load
            i64.store offset=312
            local.get 1
            i32.const 312
            i32.add
            i32.const 769272
            local.get 1
            i32.const 224
            i32.add
            call 157497
            i32.const 8059488
            i64.load align=4
            local.set 12
          end
          i32.const 8230760
          i32.load8_u
          i32.const 1
          i32.ne
          local.get 12
          i32.wrap_i64
          i32.const 255
          i32.and
          i32.const 6
          i32.lt_u
          i32.or
          local.get 12
          i64.const 8
          i64.shr_u
          i32.wrap_i64
          i32.const 255
          i32.and
          i32.const 3
          i32.lt_u
          i32.or
          i32.eqz
          if ;; label = @4
            local.get 1
            local.get 12
            i64.store offset=136
            local.get 0
            i64.load offset=68 align=4
            local.set 12
            local.get 0
            i32.load offset=76
            local.set 2
            local.get 1
            local.get 0
            i32.load offset=64
            i32.store offset=320
            local.get 1
            local.get 2
            i32.store offset=324
            local.get 1
            local.get 12
            i64.store offset=328
            local.get 1
            local.get 1
            i64.load offset=136
            i64.store offset=8
            local.get 1
            i32.const 8
            i32.add
            i32.const 2032045
            local.get 1
            i32.const 320
            i32.add
            call 157497
            i32.const 8059488
            i64.load align=4
            local.set 12
          end
          local.get 12
          i32.wrap_i64
          i32.const 255
          i32.and
          i32.const 6
          i32.lt_u
          local.get 12
          i64.const 8
          i64.shr_u
          i32.wrap_i64
          i32.const 255
          i32.and
          i32.const 3
          i32.lt_u
          i32.or
          i32.eqz
          if ;; label = @4
            local.get 0
            i32.load offset=120
            local.tee 2
            i32.load offset=60
            local.set 3
            local.get 0
            i32.load offset=88
            local.set 5
            local.get 2
            i32.load offset=48
            local.set 6
            local.get 0
            i32.load offset=92
            local.set 7
            local.get 2
            i32.load offset=52
            local.set 8
            local.get 2
            i64.load offset=64 align=4
            local.set 13
            local.get 1
            local.get 12
            i64.store offset=72
            local.get 2
            i32.load offset=56
            local.set 2
            local.get 1
            local.get 13
            i64.store offset=32
            local.get 1
            local.get 7
            local.get 8
            i32.add
            i32.store offset=16
            local.get 1
            local.get 5
            local.get 6
            i32.add
            i32.store offset=20
            local.get 1
            local.get 2
            i32.store offset=24
            local.get 1
            local.get 3
            i32.store offset=28
            local.get 1
            local.get 1
            i64.load offset=72
            i64.store offset=128
            local.get 1
            i32.const 128
            i32.add
            i32.const 806670
            local.get 1
            i32.const 16
            i32.add
            call 157497
          end
          block ;; label = @4
            i32.const 8059264
            i32.load8_u
            i32.eqz
            br_if 0 (;@4;)
            i32.const 8059264
            i64.load align=4
            local.tee 12
            i32.wrap_i64
            local.tee 2
            i32.const 8
            i32.shr_u
            i32.const 255
            i32.and
            i32.const 3
            i32.lt_u
            local.get 2
            i32.const 255
            i32.and
            i32.const 6
            i32.lt_u
            i32.or
            i32.eqz
            if ;; label = @5
              local.get 1
              local.get 12
              i64.store offset=208
              local.get 1
              local.get 1
              i64.load offset=208
              i64.store offset=144
              local.get 1
              i32.const 144
              i32.add
              i32.const 1545946
              i32.const 0
              call 157497
            end
            i32.const 0
            local.set 2
            local.get 0
            i32.load offset=120
            local.tee 3
            i32.load offset=108
            if ;; label = @5
              local.get 3
              i32.load offset=120
              local.get 3
              i32.load offset=104
              i32.const 2
              i32.shl
              i32.add
              i32.load
              local.set 2
            end
            loop ;; label = @5
              local.get 2
              i32.eqz
              br_if 1 (;@4;)
              i32.const 8059264
              i64.load align=4
              local.tee 12
              i32.wrap_i64
              i32.const 255
              i32.and
              i32.const 6
              i32.lt_u
              local.get 12
              i64.const 8
              i64.shr_u
              i32.wrap_i64
              i32.const 255
              i32.and
              i32.const 3
              i32.lt_u
              i32.or
              i32.eqz
              if ;; label = @6
                local.get 2
                i32.load offset=12
                local.set 6
                local.get 2
                i32.load offset=8
                local.tee 7
                i32.load offset=4
                local.tee 3
                i32.load
                local.set 8
                local.get 3
                i32.load8_s offset=11
                local.set 9
                local.get 2
                i32.load offset=16
                local.set 5
                local.get 2
                i32.load offset=28
                local.set 10
                local.get 2
                i64.load offset=20 align=4
                local.set 13
                local.get 1
                local.get 12
                i64.store offset=168
                local.get 1
                local.get 13
                i64.store offset=272
                local.get 1
                local.get 10
                local.get 5
                i32.div_u
                i32.store offset=280
                local.get 1
                local.get 7
                i32.store offset=256
                local.get 1
                local.get 3
                local.get 8
                local.get 9
                i32.const 0
                i32.ge_s
                select
                i32.store offset=260
                local.get 1
                local.get 6
                i32.store offset=264
                local.get 1
                local.get 5
                i32.store offset=268
                local.get 1
                local.get 1
                i64.load offset=168
                i64.store offset=152
                local.get 1
                i32.const 152
                i32.add
                i32.const 2078590
                local.get 1
                i32.const 256
                i32.add
                call 157497
              end
              local.get 2
              i32.load
              local.set 2
              br 0 (;@5;)
            end
            unreachable
          end
          local.get 4
          call 2005
          block ;; label = @4
            local.get 0
            i32.load offset=124
            local.tee 2
            i32.eqz
            br_if 0 (;@4;)
            local.get 2
            i32.const -1
            i32.atomic.rmw.add offset=4
            br_if 0 (;@4;)
            try_table (catch_all_ref 3 (;@1;)) ;; label = @5
              local.get 2
              local.get 2
              i32.load
              i32.load offset=8
              call_indirect (type 0)
            end
            local.get 2
            call 164173
          end
          i32.const 23931556
          i32.load
          local.get 1
          i32.load offset=956
          i32.eq
          if ;; label = @4
            local.get 1
            i32.const 960
            i32.add
            global.set 0
            local.get 0
            return
          end
          unreachable
        end
        unreachable
      end
      local.get 1
      global.set 0
      call 164531
      unreachable
    end
    throw_ref
  )
  (func (;38517;) (type 12) (param i32 i32 i32 i32 i32 i32)
    (local i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i64 f32 exnref)
    global.get 0
    i32.const 640
    i32.sub
    local.tee 6
    global.set 0
    local.get 0
    i32.load offset=100
    local.set 12
    block (result i32) ;; label = @1
      local.get 2
      local.get 0
      i32.load offset=96
      local.tee 9
      i32.ne
      local.get 0
      i32.load offset=108
      local.tee 13
      local.get 3
      i32.ne
      i32.or
      local.get 0
      i32.load offset=104
      local.tee 10
      local.get 4
      i32.ne
      i32.or
      i32.eqz
      if ;; label = @2
        local.get 4
        local.set 11
        local.get 3
        local.set 7
        local.get 2
        local.get 12
        local.get 5
        local.tee 8
        i32.eq
        br_if 1 (;@1;)
        drop
      end
      i32.const 7958352
      i64.load
      local.tee 22
      i32.wrap_i64
      i32.const 255
      i32.and
      i32.const 6
      i32.lt_u
      local.get 22
      i64.const 8
      i64.shr_u
      i32.wrap_i64
      i32.const 255
      i32.and
      i32.const 3
      i32.lt_u
      i32.or
      i32.eqz
      if ;; label = @2
        local.get 6
        local.get 10
        i32.store offset=592
        local.get 6
        local.get 4
        i32.store offset=596
        local.get 6
        local.get 12
        i32.store offset=600
        local.get 6
        local.get 5
        i32.store offset=604
        local.get 6
        local.get 22
        i64.store offset=512
        local.get 6
        local.get 22
        i64.store offset=504
        local.get 6
        local.get 9
        i32.store offset=576
        local.get 6
        local.get 2
        i32.store offset=580
        local.get 6
        local.get 13
        i32.store offset=584
        local.get 6
        local.get 3
        i32.store offset=588
        local.get 6
        i32.const 512
        i32.add
        i32.const 2086882
        local.get 6
        i32.const 576
        i32.add
        call 157497
        local.get 0
        i32.load offset=100
        local.set 8
        local.get 0
        i32.load offset=104
        local.set 11
        local.get 0
        i32.load offset=108
        local.set 7
        local.get 0
        i32.load offset=96
        br 1 (;@1;)
      end
      local.get 12
      local.set 8
      local.get 10
      local.set 11
      local.get 13
      local.set 7
      local.get 9
    end
    local.tee 10
    i32.const 0
    i32.ne
    local.get 0
    i32.load offset=116
    local.tee 14
    local.get 0
    i32.load offset=136
    i32.const 12
    i32.mul
    i32.add
    local.tee 9
    i32.load8_u offset=4
    local.get 10
    i32.const 2
    i32.ne
    select
    local.set 12
    local.get 11
    i32.const 2
    i32.eq
    local.set 15
    local.get 9
    i32.load
    block ;; label = @1
      local.get 7
      i32.const 0
      i32.ne
      local.get 9
      i32.load8_u offset=5
      local.get 7
      i32.const 2
      i32.ne
      select
      local.tee 13
      i32.const 1
      i32.and
      local.get 12
      i32.const 1
      i32.and
      i32.or
      br_if 0 (;@1;)
      local.get 10
      local.get 7
      i32.eqz
      i32.or
      i32.eqz
      if ;; label = @2
        i32.const 0
        local.set 12
        i32.const 1
        local.set 13
        br 1 (;@1;)
      end
      i32.const 0
      local.set 13
      local.get 7
      i32.eqz
      local.get 10
      i32.const 0
      i32.ne
      i32.and
      local.set 12
    end
    local.get 8
    i32.const 3
    i32.ne
    local.set 17
    local.get 9
    i32.load offset=8
    local.set 18
    local.get 11
    local.get 15
    select
    local.set 10
    local.get 14
    local.get 1
    i32.const 12
    i32.mul
    i32.add
    local.tee 7
    i32.load8_u offset=4
    local.get 2
    i32.const 0
    i32.ne
    local.get 2
    i32.const 2
    i32.eq
    select
    local.set 11
    local.get 5
    i32.const 3
    i32.eq
    local.set 14
    local.get 7
    i32.load offset=8
    local.set 15
    local.get 4
    local.get 7
    i32.load
    local.get 4
    i32.const 2
    i32.ne
    select
    local.set 9
    block ;; label = @1
      local.get 3
      i32.const 0
      i32.ne
      local.get 7
      i32.load8_u offset=5
      local.get 3
      i32.const 2
      i32.ne
      select
      local.tee 7
      i32.const 1
      i32.and
      local.get 11
      i32.const 1
      i32.and
      i32.or
      br_if 0 (;@1;)
      local.get 2
      i32.eqz
      if ;; label = @2
        i32.const 0
        local.set 11
        i32.const 1
        local.set 7
        local.get 3
        br_if 1 (;@1;)
      end
      i32.const 0
      local.set 7
      local.get 3
      i32.eqz
      local.get 2
      i32.const 0
      i32.ne
      i32.and
      local.set 11
    end
    local.get 9
    local.get 10
    i32.ne
    local.get 12
    i32.const 255
    i32.and
    local.tee 16
    local.get 11
    i32.const 255
    i32.and
    local.tee 19
    i32.ne
    i32.or
    local.get 13
    i32.const 255
    i32.and
    local.tee 20
    local.get 7
    i32.const 255
    i32.and
    local.tee 21
    i32.ne
    i32.or
    i32.eqz
    local.get 8
    local.get 18
    local.get 17
    select
    local.tee 17
    local.get 15
    local.get 5
    local.get 14
    select
    local.tee 15
    i32.eq
    i32.and
    i32.eqz
    if ;; label = @1
      local.get 6
      i32.const 16
      i32.add
      i32.const 18618060
      call 1178
      local.set 14
      local.get 6
      i32.const 17
      i32.store offset=452
      local.get 6
      i32.const 384473
      i32.store offset=448
      local.get 6
      local.get 6
      i64.load offset=448 align=4
      i64.store offset=384
      block ;; label = @2
        block (result exnref) ;; label = @3
          try_table (catch_all_ref 0 (;@3;)) ;; label = @4
            local.get 6
            i32.const 80
            i32.add
            local.tee 8
            local.get 6
            i32.const 384
            i32.add
            local.get 10
            i64.extend_i32_s
            i32.const 1
            call 1117
            local.get 6
            i32.const 1998967
            i32.store offset=432
            local.get 6
            i32.const 29
            i32.store offset=436
            local.get 6
            local.get 6
            i64.load offset=432 align=4
            i64.store offset=456
            local.get 8
            local.get 6
            i32.const 456
            i32.add
            local.get 13
            i32.const 1
            i32.and
            i32.const 1
            call 1010
            local.get 6
            i32.const 29
            i32.store offset=484
            local.get 6
            i32.const 1998789
            i32.store offset=480
            local.get 6
            local.get 6
            i64.load offset=480 align=4
            i64.store offset=352
            local.get 8
            local.get 6
            i32.const 352
            i32.add
            local.get 12
            i32.const 1
            i32.and
            i32.const 1
            call 1010
            local.get 6
            i32.const 30
            i32.store offset=628
            local.get 6
            i32.const 1222276
            i32.store offset=624
            local.get 6
            local.get 6
            i64.load offset=624 align=4
            i64.store offset=400
            local.get 8
            local.get 6
            i32.const 400
            i32.add
            local.get 15
            i64.extend_i32_s
            local.tee 22
            i32.const 1
            call 1117
            local.get 6
            i32.const 16
            i32.store offset=476
            local.get 6
            i32.const 381346
            i32.store offset=472
            local.get 6
            local.get 6
            i64.load offset=472 align=4
            i64.store offset=616
            local.get 8
            local.get 6
            i32.const 616
            i32.add
            local.get 9
            i64.extend_i32_s
            i32.const 1
            call 1117
            local.get 6
            i32.const 28
            i32.store offset=500
            local.get 6
            i32.const 1998938
            i32.store offset=496
            local.get 6
            local.get 6
            i64.load offset=496 align=4
            i64.store offset=376
            local.get 8
            local.get 6
            i32.const 376
            i32.add
            local.get 7
            i32.const 1
            i32.and
            i32.const 1
            call 1010
            local.get 6
            i32.const 28
            i32.store offset=364
            local.get 6
            i32.const 1998760
            i32.store offset=360
            local.get 6
            local.get 6
            i64.load offset=360 align=4
            i64.store offset=416
            local.get 8
            local.get 6
            i32.const 416
            i32.add
            local.get 11
            i32.const 1
            i32.and
            i32.const 1
            call 1010
            local.get 6
            i32.const 29
            i32.store offset=412
            local.get 6
            i32.const 1222246
            i32.store offset=408
            local.get 6
            local.get 6
            i64.load offset=408 align=4
            i64.store offset=440
            local.get 8
            local.get 6
            i32.const 440
            i32.add
            local.get 22
            i32.const 1
            call 1117
            local.get 6
            i32.const 35
            i32.store offset=396
            local.get 6
            i32.const 1674050
            i32.store offset=392
            local.get 0
            f32.load offset=140
            local.set 23
            local.get 6
            local.get 6
            i64.load offset=392 align=4
            i64.store offset=568
            local.get 8
            local.get 6
            i32.const 568
            i32.add
            local.get 23
            f64.promote_f32
            i32.const 1
            call 1124
            local.get 0
            i64.load32_s offset=136
            local.set 22
            local.get 6
            i32.const 23
            i32.store offset=372
            local.get 6
            i32.const 2064705
            i32.store offset=368
            local.get 6
            local.get 6
            i64.load offset=368 align=4
            i64.store offset=488
            local.get 8
            local.get 6
            i32.const 488
            i32.add
            local.get 22
            i32.const 1
            call 1117
            local.get 6
            i32.const 23
            i32.store offset=636
            local.get 6
            i32.const 2064666
            i32.store offset=632
            local.get 6
            local.get 6
            i64.load offset=632 align=4
            i64.store offset=464
            local.get 8
            local.get 6
            i32.const 464
            i32.add
            local.get 1
            i64.extend_i32_s
            i32.const 1
            call 1117
            local.get 6
            i32.const 27
            i32.store offset=612
            local.get 6
            i32.const 819985
            i32.store offset=608
            local.get 0
            i64.load32_s offset=112
            local.set 22
            local.get 6
            local.get 6
            i64.load offset=608 align=4
            i64.store offset=520
            local.get 8
            local.get 6
            i32.const 520
            i32.add
            local.get 22
            i32.const 1
            call 1117
            local.get 14
            call 1488
            i32.const 7958352
            i64.load
            local.tee 22
            i32.wrap_i64
            local.tee 7
            i32.const 8
            i32.shr_u
            i32.const 255
            i32.and
            i32.const 3
            i32.lt_u
            local.get 7
            i32.const 255
            i32.and
            i32.const 6
            i32.lt_u
            i32.or
            br_if 2 (;@2;)
            local.get 6
            local.get 22
            i64.store offset=8
            local.get 0
            f32.load offset=140
            local.set 23
            local.get 6
            local.get 16
            i32.store offset=544
            local.get 6
            local.get 19
            i32.store offset=548
            local.get 6
            local.get 20
            i32.store offset=552
            local.get 6
            local.get 21
            i32.store offset=556
            local.get 6
            local.get 17
            i32.store offset=560
            local.get 6
            local.get 15
            i32.store offset=564
            local.get 6
            local.get 10
            i32.store offset=536
            local.get 6
            local.get 9
            i32.store offset=540
            local.get 6
            local.get 6
            i64.load offset=8
            i64.store offset=424
            local.get 6
            local.get 23
            f32.const 0x1.f4p+9 (;=1000;)
            f32.mul
            f64.promote_f32
            f64.store offset=528
            local.get 6
            i32.const 424
            i32.add
            i32.const 2086690
            local.get 6
            i32.const 528
            i32.add
            call 157497
            br 2 (;@2;)
          end
          unreachable
        end
        local.get 6
        global.set 0
        local.get 14
        i32.const 2852528
        call 1478
        drop
        throw_ref
      end
      local.get 14
      i32.const 2852528
      call 1478
      drop
    end
    local.get 0
    i32.const 128
    i32.add
    local.tee 7
    call 158155
    local.get 0
    local.get 1
    i32.store offset=136
    block ;; label = @1
      block (result exnref) ;; label = @2
        try_table (catch_all_ref 0 (;@2;)) ;; label = @3
          local.get 0
          i32.load offset=96
          local.get 2
          i32.ne
          if ;; label = @4
            local.get 0
            local.get 2
            i32.store offset=96
            local.get 0
            i32.const 3365636
            i32.load
            call 38523
          end
          local.get 0
          i32.load offset=108
          local.get 3
          i32.ne
          if ;; label = @4
            local.get 0
            local.get 3
            i32.store offset=108
            local.get 0
            i32.const 3364748
            i32.load
            call 38523
          end
          local.get 0
          i32.load offset=104
          local.get 4
          i32.ne
          if ;; label = @4
            local.get 0
            local.get 4
            i32.store offset=104
            local.get 0
            i32.const 3365640
            i32.load
            call 38523
          end
          local.get 0
          i32.load offset=100
          local.get 5
          i32.ne
          if ;; label = @4
            local.get 0
            local.get 5
            i32.store offset=100
            local.get 0
            i32.const 3363932
            i32.load
            call 38523
          end
          block ;; label = @4
            block (result exnref) ;; label = @5
              global.get 0
              i32.const 32
              i32.sub
              local.tee 1
              global.set 0
              local.get 0
              i32.const 184
              i32.add
              local.tee 4
              call 158155
              block ;; label = @6
                local.get 0
                i32.load offset=176
                local.tee 2
                i32.eqz
                br_if 0 (;@6;)
                local.get 1
                local.get 2
                call 164174
                local.tee 2
                i32.store offset=12
                local.get 2
                i32.eqz
                br_if 0 (;@6;)
                local.get 1
                local.get 0
                i32.load offset=172
                local.tee 3
                i32.store offset=8
                local.get 3
                if ;; label = @7
                  block ;; label = @8
                    block (result exnref) ;; label = @9
                      try_table (catch_all_ref 0 (;@9;)) ;; label = @10
                        block ;; label = @11
                          local.get 0
                          i32.load offset=8
                          local.tee 2
                          if ;; label = @12
                            local.get 0
                            i32.load offset=4
                            local.set 0
                            local.get 2
                            call 164174
                            local.tee 2
                            br_if 1 (;@11;)
                          end
                          call 499
                          unreachable
                        end
                        local.get 2
                        i32.const 1
                        i32.atomic.rmw.add offset=4
                        drop
                        local.get 2
                        i32.const 1
                        i32.atomic.rmw.add offset=8
                        drop
                        local.get 2
                        i32.const -1
                        i32.atomic.rmw.add offset=4
                        i32.eqz
                        if ;; label = @11
                          try_table (catch_all_ref 6 (;@5;)) ;; label = @12
                            local.get 2
                            local.get 2
                            i32.load
                            i32.load offset=8
                            call_indirect (type 0)
                          end
                          local.get 2
                          call 164173
                        end
                        local.get 2
                        i32.const -1
                        i32.atomic.rmw.add offset=4
                        i32.eqz
                        if ;; label = @11
                          try_table (catch_all_ref 6 (;@5;)) ;; label = @12
                            local.get 2
                            local.get 2
                            i32.load
                            i32.load offset=8
                            call_indirect (type 0)
                          end
                          local.get 2
                          call 164173
                        end
                        local.get 1
                        i32.load offset=8
                        local.set 3
                        local.get 2
                        i32.const 1
                        i32.atomic.rmw.add offset=8
                        drop
                        local.get 1
                        local.get 2
                        i32.store offset=20
                        local.get 1
                        local.get 0
                        i32.store offset=16
                        local.get 1
                        i32.const 3499278
                        i32.store offset=28
                        block (result exnref) ;; label = @11
                          try_table (catch_all_ref 0 (;@11;)) ;; label = @12
                            local.get 3
                            local.get 1
                            i32.const 16
                            i32.add
                            i32.const 1
                            call 138327
                            br 4 (;@8;)
                          end
                          unreachable
                        end
                        local.get 1
                        global.set 0
                        local.get 1
                        i32.const 16
                        i32.add
                        call 166871
                        drop
                        local.get 2
                        call 164173
                        throw_ref
                      end
                      unreachable
                    end
                    local.get 1
                    global.set 0
                    local.get 1
                    i32.const 8
                    i32.add
                    call 168019
                    drop
                    block ;; label = @9
                      block ;; label = @10
                        try_table (catch_all 0 (;@10;)) ;; label = @11
                          local.get 4
                          call 158158
                          br 2 (;@9;)
                        end
                        unreachable
                      end
                      local.get 1
                      global.set 0
                      call 164531
                      unreachable
                    end
                    throw_ref
                  end
                  block ;; label = @8
                    local.get 1
                    i32.load offset=28
                    local.tee 0
                    i32.const 8
                    i32.lt_u
                    br_if 0 (;@8;)
                    local.get 0
                    i32.const 2
                    i32.and
                    local.set 5
                    block ;; label = @9
                      block ;; label = @10
                        local.get 0
                        i32.const 4
                        i32.and
                        if ;; label = @11
                          local.get 0
                          i32.const -8
                          i32.and
                          i32.load offset=12
                          local.set 3
                          local.get 1
                          i32.const 0
                          i32.store offset=28
                          local.get 5
                          i32.eqz
                          br_if 1 (;@10;)
                          local.get 3
                          i32.eqz
                          br_if 3 (;@8;)
                          local.get 1
                          i32.const 16
                          i32.add
                          local.get 3
                          call_indirect (type 0)
                          br 3 (;@8;)
                        end
                        local.get 5
                        br_if 2 (;@8;)
                        local.get 1
                        i32.const 0
                        i32.store offset=28
                        local.get 1
                        i32.load offset=24
                        drop
                        local.get 1
                        i32.load offset=16
                        local.set 0
                        br 1 (;@9;)
                      end
                      local.get 1
                      i32.load offset=24
                      drop
                      local.get 1
                      i32.load offset=16
                      local.set 0
                      local.get 3
                      i32.eqz
                      br_if 0 (;@9;)
                      local.get 0
                      local.get 3
                      call_indirect (type 0)
                    end
                    local.get 0
                    call 157417
                  end
                  local.get 2
                  call 164173
                  local.get 1
                  i32.load offset=12
                  local.tee 2
                  i32.eqz
                  br_if 1 (;@6;)
                end
                local.get 2
                i32.const -1
                i32.atomic.rmw.add offset=4
                br_if 0 (;@6;)
                local.get 2
                local.get 2
                i32.load
                i32.load offset=8
                call_indirect (type 0)
                local.get 2
                call 164173
              end
              block ;; label = @6
                block ;; label = @7
                  try_table (catch_all 0 (;@7;)) ;; label = @8
                    local.get 4
                    call 158158
                    br 2 (;@6;)
                  end
                  unreachable
                end
                local.get 1
                global.set 0
                call 164531
                unreachable
              end
              local.get 1
              i32.const 32
              i32.add
              global.set 0
              br 1 (;@4;)
            end
            throw_ref
          end
          br 2 (;@1;)
        end
        unreachable
      end
      local.get 6
      global.set 0
      block ;; label = @2
        block ;; label = @3
          try_table (catch_all 0 (;@3;)) ;; label = @4
            local.get 7
            call 158158
            br 2 (;@2;)
          end
          unreachable
        end
        local.get 6
        global.set 0
        call 164531
        unreachable
      end
      throw_ref
    end
    block ;; label = @1
      block ;; label = @2
        try_table (catch_all 0 (;@2;)) ;; label = @3
          local.get 7
          call 158158
          br 2 (;@1;)
        end
        unreachable
      end
      local.get 6
      global.set 0
      call 164531
      unreachable
    end
    local.get 6
    i32.const 640
    i32.add
    global.set 0
  )
  (func (;92691;) (type 6) (param i32 i32 i32 i32)
    (local i32 i32 i32 i32 i64 exnref)
    global.get 0
    i32.const 352
    i32.sub
    local.tee 4
    global.set 0
    block ;; label = @1
      block ;; label = @2
        local.get 2
        i32.load
        if ;; label = @3
          local.get 1
          i32.load8_s offset=11
          local.tee 5
          local.get 1
          i32.load offset=4
          local.get 5
          i32.const 0
          i32.ge_s
          select
          br_if 1 (;@2;)
        end
        local.get 0
        i32.const 0
        i32.store8 offset=8
        local.get 0
        i32.const 0
        i32.store8
        br 1 (;@1;)
      end
      local.get 4
      i64.const 0
      i64.store offset=232 align=4
      local.get 4
      block (result i32) ;; label = @2
        block ;; label = @3
          block (result exnref) ;; label = @4
            try_table (catch_all_ref 0 (;@4;)) ;; label = @5
              i32.const 23367912
              i32.load8_u
              i32.const 1
              i32.eq
              if ;; label = @6
                call 158113
                local.tee 6
                i32.const 36
                i32.const 4
                local.get 6
                i32.load
                i32.load offset=8
                call_indirect (type 7)
                local.tee 5
                local.get 6
                i32.store offset=12
                local.get 5
                i32.const 2855904
                i32.store
                local.get 5
                i64.const 0
                i64.store offset=4 align=4
                local.get 5
                v128.const i32x4 0x00000000 0x00000000 0x00000000 0x00000000
                v128.store offset=16 align=4
                local.get 5
                i32.const 1065353216
                i32.store offset=32
                local.get 5
                i32.const 16
                i32.add
                br 4 (;@2;)
              end
              i32.const 32
              call 166572
              local.set 5
              br 2 (;@3;)
            end
            unreachable
          end
          local.get 4
          global.set 0
          local.get 4
          i32.const 232
          i32.add
          call 168019
          drop
          throw_ref
        end
        local.get 5
        i64.const 0
        i64.store offset=4 align=4
        local.get 5
        i32.const 2856304
        i32.store
        local.get 5
        v128.const i32x4 0x00000000 0x00000000 0x00000000 0x00000000
        v128.store offset=12 align=4
        local.get 5
        i32.const 1065353216
        i32.store offset=28
        local.get 5
        i32.const 12
        i32.add
      end
      i32.store offset=232
      local.get 1
      i32.load offset=4
      local.get 4
      local.get 5
      i32.store offset=236
      local.get 1
      i32.load
      local.get 1
      local.get 1
      i32.load8_s offset=11
      local.tee 5
      i32.const 0
      i32.lt_s
      local.tee 7
      select
      local.set 1
      local.get 5
      local.get 7
      select
      local.set 5
      block ;; label = @2
        block ;; label = @3
          block ;; label = @4
            block ;; label = @5
              block ;; label = @6
                block (result exnref) ;; label = @7
                  try_table (catch_all_ref 0 (;@7;)) ;; label = @8
                    block ;; label = @9
                      i32.const 7913060
                      i32.load8_u
                      i32.const 1
                      i32.eq
                      if ;; label = @10
                        local.get 4
                        local.get 5
                        i32.store offset=60
                        local.get 4
                        local.get 1
                        i32.store offset=56
                        local.get 4
                        local.get 4
                        i64.load offset=56 align=4
                        i64.store offset=336
                        local.get 4
                        i32.const 336
                        i32.add
                        local.get 4
                        i32.const 232
                        i32.add
                        i32.const 0
                        local.get 3
                        call 23832
                        br_if 1 (;@9;)
                        i32.const 8072320
                        i64.load
                        local.tee 8
                        i32.wrap_i64
                        local.tee 1
                        i32.const 8
                        i32.shr_u
                        i32.const 255
                        i32.and
                        i32.const 3
                        i32.lt_u
                        local.get 1
                        i32.const 255
                        i32.and
                        i32.const 6
                        i32.lt_u
                        i32.or
                        i32.eqz
                        if ;; label = @11
                          local.get 4
                          local.get 8
                          i64.store offset=256
                          local.get 4
                          local.get 4
                          i64.load offset=256
                          i64.store offset=272
                          local.get 4
                          i32.const 272
                          i32.add
                          i32.const 1977447
                          i32.const 0
                          call 157499
                        end
                        local.get 0
                        i32.const 0
                        i32.store8 offset=8
                        local.get 0
                        i32.const 0
                        i32.store8
                        br 8 (;@2;)
                      end
                      local.get 4
                      local.get 1
                      i32.store offset=168
                      local.get 4
                      local.get 5
                      i32.store offset=172
                      local.get 4
                      local.get 4
                      i64.load offset=168 align=4
                      i64.store offset=224
                      local.get 4
                      i32.const 224
                      i32.add
                      local.get 4
                      i32.const 232
                      i32.add
                      i32.const 0
                      i32.const 0
                      call 23832
                      br_if 0 (;@9;)
                      i32.const 8072320
                      i64.load
                      local.tee 8
                      i32.wrap_i64
                      local.tee 1
                      i32.const 8
                      i32.shr_u
                      i32.const 255
                      i32.and
                      i32.const 3
                      i32.lt_u
                      local.get 1
                      i32.const 255
                      i32.and
                      i32.const 6
                      i32.lt_u
                      i32.or
                      i32.eqz
                      if ;; label = @10
                        local.get 4
                        local.get 8
                        i64.store offset=48
                        local.get 4
                        local.get 4
                        i64.load offset=48
                        i64.store offset=280
                        local.get 4
                        i32.const 280
                        i32.add
                        i32.const 1977447
                        i32.const 0
                        call 157499
                      end
                      local.get 0
                      i32.const 0
                      i32.store8 offset=8
                      local.get 0
                      i32.const 0
                      i32.store8
                      br 7 (;@2;)
                    end
                    block ;; label = @9
                      local.get 4
                      i32.load offset=232
                      i32.const 1372767
                      call 1737
                      local.tee 1
                      if ;; label = @10
                        local.get 1
                        i32.load offset=24
                        call 148697
                        i32.eq
                        br_if 1 (;@9;)
                      end
                      i32.const 8072320
                      i64.load
                      local.tee 8
                      i32.wrap_i64
                      i32.const 255
                      i32.and
                      i32.const 6
                      i32.lt_u
                      local.get 8
                      i64.const 8
                      i64.shr_u
                      i32.wrap_i64
                      i32.const 255
                      i32.and
                      i32.const 3
                      i32.lt_u
                      i32.or
                      i32.eqz
                      if ;; label = @10
                        local.get 4
                        local.get 8
                        i64.store offset=88
                        local.get 4
                        local.get 4
                        i64.load offset=88
                        i64.store offset=104
                        local.get 4
                        i32.const 104
                        i32.add
                        i32.const 1261091
                        i32.const 0
                        call 157499
                      end
                      local.get 0
                      i32.const 0
                      i32.store8 offset=8
                      local.get 0
                      i32.const 0
                      i32.store8
                      br 7 (;@2;)
                    end
                    local.get 4
                    i64.const 0
                    i64.store offset=312
                    local.get 4
                    i32.const 0
                    i32.store offset=320
                    block (result exnref) ;; label = @9
                      try_table (catch_all_ref 0 (;@9;)) ;; label = @10
                        block ;; label = @11
                          local.get 4
                          i32.load offset=232
                          i32.const 8072672
                          i32.load
                          call 1737
                          local.tee 1
                          i32.eqz
                          br_if 0 (;@11;)
                          local.get 1
                          i32.load offset=24
                          call 148697
                          i32.ne
                          br_if 0 (;@11;)
                          local.get 4
                          i32.const 156
                          i32.add
                          local.get 1
                          i32.const 24
                          i32.add
                          call 1731
                          local.get 4
                          i32.load8_s offset=323
                          i32.const 0
                          i32.lt_s
                          if ;; label = @12
                            local.get 4
                            i32.load offset=320
                            drop
                            local.get 4
                            i32.load offset=312
                            call 166574
                          end
                          local.get 4
                          local.get 4
                          i32.load offset=164
                          i32.store offset=320
                          local.get 4
                          local.get 4
                          i64.load offset=156 align=4
                          i64.store offset=312
                        end
                        local.get 4
                        i32.load offset=232
                        local.set 5
                        local.get 4
                        i32.load offset=236
                        local.set 1
                        block ;; label = @11
                          i32.const 7913060
                          i32.load8_u
                          i32.const 1
                          i32.eq
                          if ;; label = @12
                            local.get 4
                            local.get 1
                            i32.store offset=36
                            local.get 4
                            local.get 5
                            i32.store offset=32
                            local.get 1
                            if ;; label = @13
                              local.get 1
                              i32.const 1
                              i32.atomic.rmw.add offset=4
                              drop
                            end
                            local.get 4
                            local.get 4
                            i64.load offset=32 align=4
                            i64.store offset=240
                            local.get 4
                            i32.const 240
                            i32.add
                            local.get 3
                            call 92692
                            br_if 1 (;@11;)
                            i32.const 8072320
                            i64.load
                            local.tee 8
                            i32.wrap_i64
                            local.tee 1
                            i32.const 8
                            i32.shr_u
                            i32.const 255
                            i32.and
                            i32.const 3
                            i32.lt_u
                            local.get 1
                            i32.const 255
                            i32.and
                            i32.const 6
                            i32.lt_u
                            i32.or
                            i32.eqz
                            if ;; label = @13
                              local.get 4
                              local.get 8
                              i64.store offset=192
                              local.get 4
                              local.get 4
                              i64.load offset=192
                              i64.store offset=16
                              local.get 4
                              i32.const 16
                              i32.add
                              i32.const 2172755
                              i32.const 0
                              call 157499
                            end
                            local.get 0
                            i32.const 0
                            i32.store8
                            local.get 0
                            i32.const 0
                            i32.store8 offset=8
                            br 9 (;@3;)
                          end
                          local.get 4
                          local.get 1
                          i32.store offset=116
                          local.get 4
                          local.get 5
                          i32.store offset=112
                          local.get 1
                          if ;; label = @12
                            local.get 1
                            i32.const 1
                            i32.atomic.rmw.add offset=4
                            drop
                          end
                          local.get 4
                          local.get 4
                          i64.load offset=112 align=4
                          i64.store offset=136
                          local.get 4
                          i32.const 136
                          i32.add
                          i32.const 0
                          call 92692
                          br_if 0 (;@11;)
                          i32.const 8072320
                          i64.load
                          local.tee 8
                          i32.wrap_i64
                          i32.const 255
                          i32.and
                          i32.const 6
                          i32.lt_u
                          local.get 8
                          i64.const 8
                          i64.shr_u
                          i32.wrap_i64
                          i32.const 255
                          i32.and
                          i32.const 3
                          i32.lt_u
                          i32.or
                          i32.eqz
                          if ;; label = @12
                            local.get 4
                            local.get 8
                            i64.store offset=8
                            local.get 4
                            local.get 4
                            i64.load offset=8
                            i64.store offset=24
                            local.get 4
                            i32.const 24
                            i32.add
                            i32.const 2172755
                            i32.const 0
                            call 157499
                          end
                          local.get 0
                          i32.const 0
                          i32.store8 offset=8
                          local.get 0
                          i32.const 0
                          i32.store8
                          br 8 (;@3;)
                        end
                        local.get 4
                        i32.const 156
                        i32.add
                        local.tee 6
                        call 76998
                        local.get 4
                        i32.load offset=316
                        local.get 4
                        i32.load8_s offset=323
                        local.tee 1
                        local.get 1
                        i32.const 0
                        i32.lt_s
                        local.tee 5
                        select
                        local.set 1
                        local.get 4
                        i32.load offset=312
                        local.get 4
                        i32.const 312
                        i32.add
                        local.get 5
                        select
                        local.set 5
                        block (result exnref) ;; label = @11
                          try_table (catch_all_ref 0 (;@11;)) ;; label = @12
                            block ;; label = @13
                              i32.const 7913060
                              i32.load8_u
                              i32.const 1
                              i32.eq
                              if ;; label = @14
                                local.get 4
                                local.get 1
                                i32.store offset=220
                                local.get 4
                                local.get 5
                                i32.store offset=216
                                local.get 4
                                local.get 4
                                i64.load offset=216 align=4
                                i64.store offset=208
                                local.get 4
                                i32.const 208
                                i32.add
                                local.get 6
                                i32.const 0
                                local.get 3
                                call 23832
                                br_if 1 (;@13;)
                                i32.const 0
                                local.set 1
                                i32.const 8072320
                                i64.load
                                local.tee 8
                                i32.wrap_i64
                                i32.const 255
                                i32.and
                                i32.const 6
                                i32.lt_u
                                local.get 8
                                i64.const 8
                                i64.shr_u
                                i32.wrap_i64
                                i32.const 255
                                i32.and
                                i32.const 3
                                i32.lt_u
                                i32.or
                                i32.eqz
                                if ;; label = @15
                                  local.get 4
                                  local.get 8
                                  i64.store offset=96
                                  local.get 4
                                  local.get 4
                                  i64.load offset=96
                                  i64.store offset=144
                                  local.get 4
                                  i32.const 144
                                  i32.add
                                  i32.const 1005343
                                  i32.const 0
                                  call 157499
                                end
                                local.get 0
                                i32.const 0
                                i32.store8
                                br 10 (;@4;)
                              end
                              local.get 4
                              local.get 5
                              i32.store offset=128
                              local.get 4
                              local.get 1
                              i32.store offset=132
                              local.get 4
                              local.get 4
                              i64.load offset=128 align=4
                              i64.store offset=184
                              local.get 4
                              i32.const 184
                              i32.add
                              local.get 4
                              i32.const 156
                              i32.add
                              i32.const 0
                              i32.const 0
                              call 23832
                              br_if 0 (;@13;)
                              i32.const 0
                              local.set 1
                              i32.const 8072320
                              i64.load
                              local.tee 8
                              i32.wrap_i64
                              i32.const 255
                              i32.and
                              i32.const 6
                              i32.lt_u
                              local.get 8
                              i64.const 8
                              i64.shr_u
                              i32.wrap_i64
                              i32.const 255
                              i32.and
                              i32.const 3
                              i32.lt_u
                              i32.or
                              i32.eqz
                              if ;; label = @14
                                local.get 4
                                local.get 8
                                i64.store offset=80
                                local.get 4
                                local.get 4
                                i64.load offset=80
                                i64.store offset=200
                                local.get 4
                                i32.const 200
                                i32.add
                                i32.const 1005343
                                i32.const 0
                                call 157499
                              end
                              local.get 0
                              i32.const 0
                              i32.store8
                              br 9 (;@4;)
                            end
                            block ;; label = @13
                              local.get 4
                              i32.load offset=156
                              i32.const 2058852
                              call 1737
                              local.tee 1
                              if ;; label = @14
                                local.get 1
                                i32.load offset=24
                                i32.load8_u offset=33
                                br_if 1 (;@13;)
                              end
                              i32.const 0
                              local.set 1
                              i32.const 8072320
                              i64.load
                              local.tee 8
                              i32.wrap_i64
                              local.tee 2
                              i32.const 8
                              i32.shr_u
                              i32.const 255
                              i32.and
                              i32.const 3
                              i32.lt_u
                              local.get 2
                              i32.const 255
                              i32.and
                              i32.const 6
                              i32.lt_u
                              i32.or
                              i32.eqz
                              if ;; label = @14
                                local.get 4
                                local.get 8
                                i64.store offset=120
                                local.get 4
                                local.get 4
                                i64.load offset=120
                                i64.store offset=40
                                local.get 4
                                i32.const 40
                                i32.add
                                i32.const 2058407
                                i32.const 0
                                call 157499
                              end
                              local.get 0
                              i32.const 0
                              i32.store8
                              br 9 (;@4;)
                            end
                            local.get 1
                            i32.const 24
                            i32.add
                            call 1724
                            local.set 8
                            local.get 2
                            i32.load
                            local.set 1
                            block (result i64) ;; label = @13
                              i32.const 8089800
                              i32.load8_u
                              i32.const 1
                              i32.eq
                              if ;; label = @14
                                local.get 1
                                i64.load offset=128
                                br 1 (;@13;)
                              end
                              local.get 1
                              i32.const 96
                              i32.add
                              call 104822
                            end
                            local.get 8
                            i64.ne
                            if ;; label = @13
                              i32.const 0
                              local.set 1
                              i32.const 8072320
                              i64.load
                              local.tee 8
                              i32.wrap_i64
                              local.tee 2
                              i32.const 8
                              i32.shr_u
                              i32.const 255
                              i32.and
                              i32.const 3
                              i32.lt_u
                              local.get 2
                              i32.const 255
                              i32.and
                              i32.const 6
                              i32.lt_u
                              i32.or
                              i32.eqz
                              if ;; label = @14
                                local.get 4
                                local.get 8
                                i64.store offset=64
                                local.get 4
                                local.get 4
                                i64.load offset=64
                                i64.store offset=288
                                local.get 4
                                i32.const 288
                                i32.add
                                i32.const 2058788
                                i32.const 0
                                call 157499
                              end
                              local.get 0
                              i32.const 0
                              i32.store8
                              br 9 (;@4;)
                            end
                            block ;; label = @13
                              local.get 4
                              i32.load offset=156
                              i32.const 4216976
                              call 1737
                              local.tee 1
                              if ;; label = @14
                                local.get 1
                                i32.load offset=24
                                i32.load8_u offset=33
                                br_if 1 (;@13;)
                              end
                              i32.const 0
                              local.set 1
                              i32.const 8072320
                              i64.load
                              local.tee 8
                              i32.wrap_i64
                              i32.const 255
                              i32.and
                              i32.const 6
                              i32.lt_u
                              local.get 8
                              i64.const 8
                              i64.shr_u
                              i32.wrap_i64
                              i32.const 255
                              i32.and
                              i32.const 3
                              i32.lt_u
                              i32.or
                              i32.eqz
                              if ;; label = @14
                                local.get 4
                                local.get 8
                                i64.store offset=328
                                local.get 4
                                local.get 4
                                i64.load offset=328
                                i64.store offset=176
                                local.get 4
                                i32.const 176
                                i32.add
                                i32.const 1778888
                                i32.const 0
                                call 157499
                              end
                              local.get 0
                              i32.const 0
                              i32.store8
                              br 9 (;@4;)
                            end
                            local.get 1
                            i32.const 24
                            i32.add
                            call 1963
                            local.set 1
                            local.get 1
                            local.get 2
                            i32.load
                            i32.load offset=484
                            local.tee 2
                            i32.eq
                            local.get 1
                            local.get 2
                            i32.const 1
                            i32.sub
                            i32.eq
                            i32.or
                            i32.eqz
                            if ;; label = @13
                              i32.const 0
                              local.set 1
                              i32.const 8072320
                              i64.load
                              local.tee 8
                              i32.wrap_i64
                              i32.const 255
                              i32.and
                              i32.const 6
                              i32.lt_u
                              local.get 8
                              i64.const 8
                              i64.shr_u
                              i32.wrap_i64
                              i32.const 255
                              i32.and
                              i32.const 3
                              i32.lt_u
                              i32.or
                              i32.eqz
                              if ;; label = @14
                                local.get 4
                                local.get 8
                                i64.store offset=344
                                local.get 4
                                local.get 4
                                i64.load offset=344
                                i64.store offset=296
                                local.get 4
                                i32.const 296
                                i32.add
                                i32.const 1778930
                                i32.const 0
                                call 157499
                              end
                              local.get 0
                              i32.const 0
                              i32.store8
                              br 9 (;@4;)
                            end
                            block ;; label = @13
                              local.get 4
                              i32.load offset=156
                              i32.const 8072536
                              i32.load
                              call 1737
                              local.tee 1
                              if ;; label = @14
                                local.get 1
                                i32.load offset=24
                                call 148746
                                i32.eq
                                br_if 1 (;@13;)
                              end
                              i32.const 0
                              local.set 1
                              i32.const 8072320
                              i64.load
                              local.tee 8
                              i32.wrap_i64
                              local.tee 2
                              i32.const 8
                              i32.shr_u
                              i32.const 255
                              i32.and
                              i32.const 3
                              i32.lt_u
                              local.get 2
                              i32.const 255
                              i32.and
                              i32.const 6
                              i32.lt_u
                              i32.or
                              i32.eqz
                              if ;; label = @14
                                local.get 4
                                local.get 8
                                i64.store offset=248
                                local.get 4
                                local.get 4
                                i64.load offset=248
                                i64.store offset=264
                                local.get 4
                                i32.const 264
                                i32.add
                                i32.const 2171619
                                i32.const 0
                                call 157499
                              end
                              local.get 0
                              i32.const 0
                              i32.store8
                              br 9 (;@4;)
                            end
                            local.get 4
                            i32.load offset=156
                            i32.const 2173212
                            call 1737
                            local.tee 1
                            if ;; label = @13
                              local.get 1
                              i32.load offset=24
                              call 148746
                              i32.eq
                              br_if 7 (;@6;)
                            end
                            i32.const 0
                            local.set 1
                            i32.const 8072320
                            i64.load
                            local.tee 8
                            i32.wrap_i64
                            local.tee 2
                            i32.const 8
                            i32.shr_u
                            i32.const 255
                            i32.and
                            i32.const 3
                            i32.lt_u
                            local.get 2
                            i32.const 255
                            i32.and
                            i32.const 6
                            i32.lt_u
                            i32.or
                            br_if 7 (;@5;)
                            local.get 4
                            local.get 8
                            i64.store offset=72
                            local.get 4
                            local.get 4
                            i64.load offset=72
                            i64.store offset=304
                            local.get 4
                            i32.const 304
                            i32.add
                            i32.const 2173181
                            i32.const 0
                            call 157499
                            br 7 (;@5;)
                          end
                          unreachable
                        end
                        local.get 4
                        global.set 0
                        local.get 4
                        i32.const 156
                        i32.add
                        call 168019
                        drop
                        throw_ref
                      end
                      unreachable
                    end
                    local.get 4
                    global.set 0
                    local.get 4
                    i32.load8_s offset=323
                    i32.const 0
                    i32.lt_s
                    if ;; label = @9
                      local.get 4
                      i32.load offset=320
                      drop
                      local.get 4
                      i32.load offset=312
                      call 166574
                    end
                    throw_ref
                  end
                  unreachable
                end
                local.get 4
                global.set 0
                local.get 4
                i32.const 232
                i32.add
                call 168019
                drop
                throw_ref
              end
              local.get 4
              i32.load offset=156
              local.set 1
              local.get 4
              i32.const 0
              i32.store offset=156
              local.get 0
              local.get 1
              i32.store
              local.get 4
              i32.load offset=160
              local.set 1
              local.get 4
              i32.const 0
              i32.store offset=160
              local.get 0
              local.get 1
              i32.store offset=4
              i32.const 1
              local.set 1
              br 1 (;@4;)
            end
            local.get 0
            i32.const 0
            i32.store8
          end
          local.get 0
          local.get 1
          i32.store8 offset=8
          local.get 4
          i32.const 156
          i32.add
          call 168019
          drop
        end
        local.get 4
        i32.load8_s offset=323
        i32.const 0
        i32.ge_s
        br_if 0 (;@2;)
        local.get 4
        i32.load offset=320
        drop
        local.get 4
        i32.load offset=312
        call 166574
      end
      local.get 4
      i32.load offset=236
      local.tee 0
      i32.eqz
      br_if 0 (;@1;)
      local.get 0
      i32.const -1
      i32.atomic.rmw.add offset=4
      br_if 0 (;@1;)
      local.get 0
      local.get 0
      i32.load
      i32.load offset=8
      call_indirect (type 0)
      local.get 0
      call 164173
    end
    local.get 4
    i32.const 352
    i32.add
    global.set 0
  )
  (func (;127961;) (type 3) (param i32 i32 i32)
    (local i32 i32 i32 i32 exnref)
    global.get 0
    i32.const -64
    i32.add
    local.tee 3
    global.set 0
    local.get 3
    v128.const i32x4 0x00000000 0x00000000 0x00000000 0x00000000
    v128.store offset=40 align=8
    local.get 3
    v128.const i32x4 0x00000000 0x00000000 0x00000000 0x00000000
    v128.store offset=24 align=8
    local.get 3
    i64.const 0
    i64.store offset=56
    local.get 3
    i32.const 0
    i32.store offset=44
    local.get 3
    i32.const 1
    i32.store8 offset=39
    local.get 3
    i32.const 32
    i32.store8 offset=35
    local.get 3
    i32.const -1
    i32.store offset=28
    local.get 3
    i32.const 24
    i32.add
    local.tee 5
    local.get 1
    call 966
    local.set 4
    local.get 1
    i32.load
    local.set 6
    local.get 1
    local.get 4
    i32.store
    local.get 1
    local.get 1
    i32.load offset=4
    local.get 6
    local.get 4
    i32.sub
    i32.add
    i32.store offset=4
    local.get 3
    i32.const 12
    i32.add
    local.set 1
    block ;; label = @1
      block ;; label = @2
        block ;; label = @3
          block ;; label = @4
            block ;; label = @5
              block ;; label = @6
                block ;; label = @7
                  block ;; label = @8
                    block ;; label = @9
                      block ;; label = @10
                        block ;; label = @11
                          block ;; label = @12
                            block ;; label = @13
                              block ;; label = @14
                                block ;; label = @15
                                  block ;; label = @16
                                    block ;; label = @17
                                      block ;; label = @18
                                        block ;; label = @19
                                          block ;; label = @20
                                            block ;; label = @21
                                              block ;; label = @22
                                                block ;; label = @23
                                                  block ;; label = @24
                                                    block ;; label = @25
                                                      block ;; label = @26
                                                        block ;; label = @27
                                                          block ;; label = @28
                                                            block ;; label = @29
                                                              block ;; label = @30
                                                                block ;; label = @31
                                                                  block ;; label = @32
                                                                    block ;; label = @33
                                                                      block ;; label = @34
                                                                        block ;; label = @35
                                                                          block ;; label = @36
                                                                            block ;; label = @37
                                                                              block ;; label = @38
                                                                                block ;; label = @39
                                                                                  block ;; label = @40
                                                                                    block ;; label = @41
                                                                                      block ;; label = @42
                                                                                        block ;; label = @43
                                                                                          local.get 0
                                                                                          i32.load8_u
                                                                                          br_table 0 (;@43;) 1 (;@42;) 2 (;@41;) 3 (;@40;) 4 (;@39;) 5 (;@38;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 19 (;@24;) 20 (;@23;) 21 (;@22;) 22 (;@21;) 23 (;@20;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 6 (;@37;) 7 (;@36;) 8 (;@35;) 9 (;@34;) 10 (;@33;) 11 (;@32;) 12 (;@31;) 13 (;@30;) 14 (;@29;) 15 (;@28;) 16 (;@27;) 17 (;@26;) 18 (;@25;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 24 (;@19;) 25 (;@18;) 26 (;@17;) 27 (;@16;) 28 (;@15;) 29 (;@14;) 30 (;@13;) 31 (;@12;) 32 (;@11;) 33 (;@10;) 34 (;@9;) 35 (;@8;) 36 (;@7;) 39 (;@4;) 39 (;@4;) 39 (;@4;) 37 (;@6;) 38 (;@5;) 39 (;@4;)
                                                                                        end
                                                                                        i32.const 40
                                                                                        call 166572
                                                                                        local.set 0
                                                                                        local.get 1
                                                                                        i32.const 33
                                                                                        i32.store offset=4
                                                                                        local.get 1
                                                                                        local.get 0
                                                                                        i32.store
                                                                                        local.get 0
                                                                                        i32.const 2254015
                                                                                        i32.load8_u
                                                                                        i32.store8 offset=32
                                                                                        local.get 0
                                                                                        i32.const 2253999
                                                                                        v128.load align=1
                                                                                        v128.store offset=16 align=1
                                                                                        local.get 0
                                                                                        i32.const 2253983
                                                                                        v128.load align=1
                                                                                        v128.store align=1
                                                                                        local.get 1
                                                                                        i32.const -2147483608
                                                                                        i32.store offset=8
                                                                                        local.get 0
                                                                                        i32.const 0
                                                                                        i32.store8 offset=33
                                                                                        br 41 (;@1;)
                                                                                      end
                                                                                      i32.const 32
                                                                                      call 166572
                                                                                      local.set 0
                                                                                      local.get 1
                                                                                      i64.const -9223371899415822310
                                                                                      i64.store offset=4 align=4
                                                                                      local.get 1
                                                                                      local.get 0
                                                                                      i32.store
                                                                                      local.get 0
                                                                                      i32.const 2253464
                                                                                      i32.load16_u align=1
                                                                                      i32.store16 offset=24 align=1
                                                                                      local.get 0
                                                                                      i32.const 2253456
                                                                                      i64.load align=1
                                                                                      i64.store offset=16 align=1
                                                                                      local.get 0
                                                                                      i32.const 0
                                                                                      i32.store8 offset=26
                                                                                      local.get 0
                                                                                      i32.const 2253440
                                                                                      v128.load align=1
                                                                                      v128.store align=1
                                                                                      br 40 (;@1;)
                                                                                    end
                                                                                    local.get 1
                                                                                    i32.const 32
                                                                                    call 166572
                                                                                    local.tee 0
                                                                                    i32.store
                                                                                    local.get 1
                                                                                    i64.const -9223371899415822307
                                                                                    i64.store offset=4 align=4
                                                                                    local.get 0
                                                                                    i32.const 2212644
                                                                                    i64.load align=1
                                                                                    i64.store offset=21 align=1
                                                                                    local.get 0
                                                                                    i32.const 2212639
                                                                                    i64.load align=1
                                                                                    i64.store offset=16 align=1
                                                                                    local.get 0
                                                                                    i32.const 0
                                                                                    i32.store8 offset=29
                                                                                    local.get 0
                                                                                    i32.const 2212623
                                                                                    v128.load align=1
                                                                                    v128.store align=1
                                                                                    br 39 (;@1;)
                                                                                  end
                                                                                  i32.const 40
                                                                                  call 166572
                                                                                  local.set 0
                                                                                  local.get 1
                                                                                  i64.const -9223371865056083930
                                                                                  i64.store offset=4 align=4
                                                                                  local.get 1
                                                                                  local.get 0
                                                                                  i32.store
                                                                                  local.get 0
                                                                                  i32.const 0
                                                                                  i32.store8 offset=38
                                                                                  local.get 0
                                                                                  i32.const 2251136
                                                                                  v128.load align=1
                                                                                  v128.store align=1
                                                                                  local.get 0
                                                                                  i32.const 2251152
                                                                                  v128.load align=1
                                                                                  v128.store offset=16 align=1
                                                                                  local.get 0
                                                                                  i32.const 2251166
                                                                                  i64.load align=1
                                                                                  i64.store offset=30 align=1
                                                                                  br 38 (;@1;)
                                                                                end
                                                                                i32.const 32
                                                                                call 166572
                                                                                local.set 0
                                                                                local.get 1
                                                                                i32.const -2147483616
                                                                                i32.store offset=8
                                                                                local.get 0
                                                                                i32.const 2261168
                                                                                i64.load align=1
                                                                                i64.store offset=21 align=1
                                                                                local.get 0
                                                                                i32.const 2261163
                                                                                i64.load align=1
                                                                                i64.store offset=16 align=1
                                                                                local.get 0
                                                                                i32.const 2261147
                                                                                v128.load align=1
                                                                                v128.store align=1
                                                                                local.get 1
                                                                                i32.const 29
                                                                                i32.store offset=4
                                                                                local.get 0
                                                                                i32.const 0
                                                                                i32.store8 offset=29
                                                                                br 35 (;@3;)
                                                                              end
                                                                              i32.const 40
                                                                              call 166572
                                                                              local.set 0
                                                                              local.get 1
                                                                              i64.const -9223371865056083930
                                                                              i64.store offset=4 align=4
                                                                              local.get 0
                                                                              i32.const 0
                                                                              i32.store8 offset=38
                                                                              local.get 1
                                                                              local.get 0
                                                                              i32.store
                                                                              local.get 0
                                                                              i32.const 2212863
                                                                              i64.load align=1
                                                                              i64.store offset=30 align=1
                                                                              local.get 0
                                                                              i32.const 2212849
                                                                              v128.load align=1
                                                                              v128.store offset=16 align=1
                                                                              local.get 0
                                                                              i32.const 2212833
                                                                              v128.load align=1
                                                                              v128.store align=1
                                                                              br 36 (;@1;)
                                                                            end
                                                                            i32.const 16
                                                                            call 166572
                                                                            local.tee 0
                                                                            i32.const 2258397
                                                                            i32.load align=1
                                                                            i32.store offset=7 align=1
                                                                            local.get 0
                                                                            i32.const 2258390
                                                                            i64.load align=1
                                                                            i64.store align=1
                                                                            local.get 1
                                                                            i64.const -9223371968135299061
                                                                            i64.store offset=4 align=4
                                                                            local.get 1
                                                                            local.get 0
                                                                            i32.store
                                                                            local.get 0
                                                                            i32.const 0
                                                                            i32.store8 offset=11
                                                                            br 35 (;@1;)
                                                                          end
                                                                          i32.const 24
                                                                          call 166572
                                                                          local.set 0
                                                                          local.get 1
                                                                          i64.const -9223371933775560687
                                                                          i64.store offset=4 align=4
                                                                          local.get 0
                                                                          i32.const 2226467
                                                                          i32.load8_u
                                                                          i32.store8 offset=16
                                                                          local.get 0
                                                                          i32.const 2226451
                                                                          v128.load align=1
                                                                          v128.store align=1
                                                                          local.get 1
                                                                          local.get 0
                                                                          i32.store
                                                                          local.get 0
                                                                          i32.const 0
                                                                          i32.store8 offset=17
                                                                          br 34 (;@1;)
                                                                        end
                                                                        i32.const 48
                                                                        call 166572
                                                                        local.set 0
                                                                        local.get 1
                                                                        i64.const -9223371830696345560
                                                                        i64.store offset=4 align=4
                                                                        local.get 1
                                                                        local.get 0
                                                                        i32.store
                                                                        local.get 0
                                                                        i32.const 0
                                                                        i32.store8 offset=40
                                                                        local.get 0
                                                                        i32.const 2244654
                                                                        i64.load align=1
                                                                        i64.store align=1
                                                                        local.get 0
                                                                        i32.const 2244662
                                                                        v128.load align=1
                                                                        v128.store offset=8 align=1
                                                                        local.get 0
                                                                        i32.const 2244678
                                                                        v128.load align=1
                                                                        v128.store offset=24 align=1
                                                                        br 33 (;@1;)
                                                                      end
                                                                      i32.const 40
                                                                      call 166572
                                                                      local.set 0
                                                                      local.get 1
                                                                      i64.const -9223371865056083931
                                                                      i64.store offset=4 align=4
                                                                      local.get 1
                                                                      local.get 0
                                                                      i32.store
                                                                      local.get 0
                                                                      i32.const 0
                                                                      i32.store8 offset=37
                                                                      local.get 0
                                                                      i32.const 2212566
                                                                      v128.load align=1
                                                                      v128.store align=1
                                                                      local.get 0
                                                                      i32.const 2212582
                                                                      v128.load align=1
                                                                      v128.store offset=16 align=1
                                                                      local.get 0
                                                                      i32.const 2212595
                                                                      i64.load align=1
                                                                      i64.store offset=29 align=1
                                                                      br 32 (;@1;)
                                                                    end
                                                                    i32.const 56
                                                                    call 166572
                                                                    local.set 0
                                                                    local.get 1
                                                                    i64.const -9223371796336607183
                                                                    i64.store offset=4 align=4
                                                                    local.get 1
                                                                    local.get 0
                                                                    i32.store
                                                                    local.get 0
                                                                    i32.const 2214762
                                                                    i32.load8_u
                                                                    i32.store8 offset=48
                                                                    local.get 0
                                                                    i32.const 0
                                                                    i32.store8 offset=49
                                                                    local.get 0
                                                                    i32.const 2214746
                                                                    v128.load align=1
                                                                    v128.store offset=32 align=1
                                                                    local.get 0
                                                                    i32.const 2214730
                                                                    v128.load align=1
                                                                    v128.store offset=16 align=1
                                                                    local.get 0
                                                                    i32.const 2214714
                                                                    v128.load align=1
                                                                    v128.store align=1
                                                                    br 31 (;@1;)
                                                                  end
                                                                  i32.const 32
                                                                  call 166572
                                                                  local.set 0
                                                                  local.get 1
                                                                  i64.const -9223371899415822307
                                                                  i64.store offset=4 align=4
                                                                  local.get 1
                                                                  local.get 0
                                                                  i32.store
                                                                  local.get 0
                                                                  i32.const 2262638
                                                                  i64.load align=1
                                                                  i64.store offset=21 align=1
                                                                  local.get 0
                                                                  i32.const 2262633
                                                                  i64.load align=1
                                                                  i64.store offset=16 align=1
                                                                  local.get 0
                                                                  i32.const 0
                                                                  i32.store8 offset=29
                                                                  local.get 0
                                                                  i32.const 2262617
                                                                  v128.load align=1
                                                                  v128.store align=1
                                                                  br 30 (;@1;)
                                                                end
                                                                i32.const 40
                                                                call 166572
                                                                local.tee 0
                                                                i32.const 2253942
                                                                i32.load align=1
                                                                i32.store offset=32 align=1
                                                                local.get 0
                                                                i32.const 2253926
                                                                v128.load align=1
                                                                v128.store offset=16 align=1
                                                                local.get 0
                                                                i32.const 2253910
                                                                v128.load align=1
                                                                v128.store align=1
                                                                local.get 1
                                                                i64.const -9223371865056083932
                                                                i64.store offset=4 align=4
                                                                local.get 1
                                                                local.get 0
                                                                i32.store
                                                                local.get 0
                                                                i32.const 0
                                                                i32.store8 offset=36
                                                                br 29 (;@1;)
                                                              end
                                                              i32.const 40
                                                              call 166572
                                                              local.set 0
                                                              local.get 1
                                                              i64.const -9223371865056083933
                                                              i64.store offset=4 align=4
                                                              local.get 1
                                                              local.get 0
                                                              i32.store
                                                              local.get 0
                                                              i32.const 2253978
                                                              i32.load align=1
                                                              i32.store offset=31 align=1
                                                              local.get 0
                                                              i32.const 0
                                                              i32.store8 offset=35
                                                              local.get 0
                                                              i32.const 2253963
                                                              v128.load align=1
                                                              v128.store offset=16 align=1
                                                              local.get 0
                                                              i32.const 2253947
                                                              v128.load align=1
                                                              v128.store align=1
                                                              br 28 (;@1;)
                                                            end
                                                            i32.const 32
                                                            call 166572
                                                            local.tee 0
                                                            i32.const 0
                                                            i32.store8 offset=29
                                                            local.get 1
                                                            i32.const 29
                                                            i32.store offset=4
                                                            local.get 0
                                                            i32.const 2262540
                                                            i64.load align=1
                                                            i64.store offset=21 align=1
                                                            local.get 0
                                                            i32.const 2262535
                                                            i64.load align=1
                                                            i64.store offset=16 align=1
                                                            local.get 0
                                                            i32.const 2262519
                                                            v128.load align=1
                                                            v128.store align=1
                                                            local.get 1
                                                            i32.const -2147483616
                                                            i32.store offset=8
                                                            br 25 (;@3;)
                                                          end
                                                          local.get 1
                                                          i32.const 32
                                                          call 166572
                                                          local.tee 0
                                                          i32.store
                                                          local.get 0
                                                          i32.const 2254239
                                                          i32.load align=1
                                                          i32.store offset=24 align=1
                                                          local.get 0
                                                          i32.const 2254231
                                                          i64.load align=1
                                                          i64.store offset=16 align=1
                                                          local.get 0
                                                          i32.const 2254215
                                                          v128.load align=1
                                                          v128.store align=1
                                                          local.get 1
                                                          i32.const 28
                                                          i32.store offset=4
                                                          local.get 0
                                                          i32.const 0
                                                          i32.store8 offset=28
                                                          local.get 1
                                                          i32.const -2147483616
                                                          i32.store offset=8
                                                          br 26 (;@1;)
                                                        end
                                                        local.get 1
                                                        i32.const 32
                                                        call 166572
                                                        local.tee 0
                                                        i32.store
                                                        local.get 1
                                                        i32.const 31
                                                        i32.store offset=4
                                                        local.get 0
                                                        i32.const 2213688
                                                        i64.load align=1
                                                        i64.store offset=23 align=1
                                                        local.get 0
                                                        i32.const 2213681
                                                        i64.load align=1
                                                        i64.store offset=16 align=1
                                                        local.get 0
                                                        i32.const 2213665
                                                        v128.load align=1
                                                        v128.store align=1
                                                        local.get 1
                                                        i32.const -2147483616
                                                        i32.store offset=8
                                                        local.get 0
                                                        i32.const 0
                                                        i32.store8 offset=31
                                                        br 25 (;@1;)
                                                      end
                                                      local.get 1
                                                      i32.const 24
                                                      call 166572
                                                      local.tee 0
                                                      i32.store
                                                      local.get 1
                                                      i64.const -9223371933775560686
                                                      i64.store offset=4 align=4
                                                      local.get 0
                                                      i32.const 0
                                                      i32.store8 offset=18
                                                      local.get 0
                                                      i32.const 2210284
                                                      v128.load align=1
                                                      v128.store align=1
                                                      local.get 0
                                                      i32.const 2210300
                                                      i32.load16_u align=1
                                                      i32.store16 offset=16 align=1
                                                      br 24 (;@1;)
                                                    end
                                                    i32.const 24
                                                    call 166572
                                                    local.tee 0
                                                    i32.const 0
                                                    i32.store8 offset=21
                                                    local.get 1
                                                    local.get 0
                                                    i32.store
                                                    local.get 1
                                                    i32.const 21
                                                    i32.store offset=4
                                                    local.get 0
                                                    i32.const 2253664
                                                    i64.load align=1
                                                    i64.store offset=13 align=1
                                                    local.get 0
                                                    i32.const 2253651
                                                    v128.load align=1
                                                    v128.store align=1
                                                    local.get 1
                                                    i32.const -2147483624
                                                    i32.store offset=8
                                                    br 23 (;@1;)
                                                  end
                                                  i32.const 24
                                                  call 166572
                                                  local.set 0
                                                  local.get 1
                                                  i32.const -2147483624
                                                  i32.store offset=8
                                                  local.get 0
                                                  i32.const 0
                                                  i32.store8 offset=22
                                                  local.get 1
                                                  i32.const 22
                                                  i32.store offset=4
                                                  local.get 1
                                                  local.get 0
                                                  i32.store
                                                  local.get 0
                                                  i32.const 2262112
                                                  i64.load align=1
                                                  i64.store offset=14 align=1
                                                  local.get 0
                                                  i32.const 2262098
                                                  v128.load align=1
                                                  v128.store align=1
                                                  br 22 (;@1;)
                                                end
                                                i32.const 32
                                                call 166572
                                                local.set 0
                                                local.get 1
                                                i64.const -9223371899415822308
                                                i64.store offset=4 align=4
                                                local.get 0
                                                i32.const 2212896
                                                i32.load align=1
                                                i32.store offset=24 align=1
                                                local.get 0
                                                i32.const 2212888
                                                i64.load align=1
                                                i64.store offset=16 align=1
                                                local.get 0
                                                i32.const 2212872
                                                v128.load align=1
                                                v128.store align=1
                                                local.get 1
                                                local.get 0
                                                i32.store
                                                local.get 0
                                                i32.const 0
                                                i32.store8 offset=28
                                                br 21 (;@1;)
                                              end
                                              i32.const 40
                                              call 166572
                                              local.set 0
                                              local.get 1
                                              i64.const -9223371865056083935
                                              i64.store offset=4 align=4
                                              local.get 0
                                              i32.const 2245046
                                              i32.load8_u
                                              i32.store8 offset=32
                                              local.get 0
                                              i32.const 0
                                              i32.store8 offset=33
                                              local.get 0
                                              i32.const 2245030
                                              v128.load align=1
                                              v128.store offset=16 align=1
                                              local.get 0
                                              i32.const 2245014
                                              v128.load align=1
                                              v128.store align=1
                                              br 18 (;@3;)
                                            end
                                            i32.const 32
                                            call 166572
                                            local.set 0
                                            local.get 1
                                            i32.const -2147483616
                                            i32.store offset=8
                                            local.get 0
                                            i32.const 2245005
                                            i64.load align=1
                                            i64.store offset=22 align=1
                                            local.get 0
                                            i32.const 2244999
                                            i64.load align=1
                                            i64.store offset=16 align=1
                                            local.get 0
                                            i32.const 2244983
                                            v128.load align=1
                                            v128.store align=1
                                            local.get 1
                                            i32.const 30
                                            i32.store offset=4
                                            local.get 1
                                            local.get 0
                                            i32.store
                                            local.get 0
                                            i32.const 0
                                            i32.store8 offset=30
                                            br 19 (;@1;)
                                          end
                                          i32.const 32
                                          call 166572
                                          local.set 0
                                          local.get 1
                                          i64.const -9223371899415822310
                                          i64.store offset=4 align=4
                                          local.get 1
                                          local.get 0
                                          i32.store
                                          local.get 0
                                          i32.const 0
                                          i32.store8 offset=26
                                          local.get 0
                                          i32.const 2258314
                                          i64.load align=1
                                          i64.store align=1
                                          local.get 0
                                          i32.const 2258322
                                          v128.load align=1
                                          v128.store offset=8 align=1
                                          local.get 0
                                          i32.const 2258338
                                          i32.load16_u align=1
                                          i32.store16 offset=24 align=1
                                          br 18 (;@1;)
                                        end
                                        i32.const 16
                                        call 166572
                                        local.set 0
                                        local.get 1
                                        i32.const -2147483632
                                        i32.store offset=8
                                        local.get 1
                                        local.get 0
                                        i32.store
                                        local.get 0
                                        i32.const 2261328
                                        i64.load align=1
                                        i64.store offset=7 align=1
                                        local.get 0
                                        i32.const 2261321
                                        i64.load align=1
                                        i64.store align=1
                                        local.get 0
                                        i32.const 0
                                        i32.store8 offset=15
                                        local.get 1
                                        i32.const 15
                                        i32.store offset=4
                                        br 17 (;@1;)
                                      end
                                      local.get 1
                                      i32.const 24
                                      call 166572
                                      local.tee 0
                                      i32.store
                                      local.get 0
                                      i32.const 2212807
                                      i32.load align=1
                                      i32.store offset=16 align=1
                                      local.get 0
                                      i32.const 2212791
                                      v128.load align=1
                                      v128.store align=1
                                      local.get 1
                                      i32.const -2147483624
                                      i32.store offset=8
                                      local.get 0
                                      i32.const 0
                                      i32.store8 offset=20
                                      local.get 1
                                      i32.const 20
                                      i32.store offset=4
                                      br 16 (;@1;)
                                    end
                                    i32.const 24
                                    call 166572
                                    local.set 0
                                    local.get 1
                                    i32.const 21
                                    i32.store offset=4
                                    local.get 0
                                    i32.const 0
                                    i32.store8 offset=21
                                    local.get 1
                                    i32.const -2147483624
                                    i32.store offset=8
                                    local.get 0
                                    i32.const 2261578
                                    i64.load align=1
                                    i64.store offset=13 align=1
                                    local.get 0
                                    i32.const 2261565
                                    v128.load align=1
                                    v128.store align=1
                                    br 13 (;@3;)
                                  end
                                  i32.const 24
                                  call 166572
                                  local.set 0
                                  local.get 1
                                  i32.const 19
                                  i32.store offset=4
                                  local.get 1
                                  local.get 0
                                  i32.store
                                  local.get 0
                                  i32.const 2262458
                                  i32.load align=1
                                  i32.store offset=15 align=1
                                  local.get 0
                                  i32.const 2262443
                                  v128.load align=1
                                  v128.store align=1
                                  local.get 1
                                  i32.const -2147483624
                                  i32.store offset=8
                                  local.get 0
                                  i32.const 0
                                  i32.store8 offset=19
                                  br 14 (;@1;)
                                end
                                i32.const 32
                                call 166572
                                local.tee 0
                                i32.const 2212925
                                i32.load8_u
                                i32.store8 offset=24
                                local.get 0
                                i32.const 2212917
                                i64.load align=1
                                i64.store offset=16 align=1
                                local.get 0
                                i32.const 2212901
                                v128.load align=1
                                v128.store align=1
                                br 12 (;@2;)
                              end
                              i32.const 32
                              call 166572
                              local.set 0
                              local.get 1
                              i64.const -9223371899415822310
                              i64.store offset=4 align=4
                              local.get 1
                              local.get 0
                              i32.store
                              local.get 0
                              i32.const 0
                              i32.store8 offset=26
                              local.get 0
                              i32.const 2250083
                              i64.load align=1
                              i64.store align=1
                              local.get 0
                              i32.const 2250091
                              v128.load align=1
                              v128.store offset=8 align=1
                              local.get 0
                              i32.const 2250107
                              i32.load16_u align=1
                              i32.store16 offset=24 align=1
                              br 12 (;@1;)
                            end
                            i32.const 32
                            call 166572
                            local.set 0
                            local.get 1
                            i64.const -9223371899415822312
                            i64.store offset=4 align=4
                            local.get 1
                            local.get 0
                            i32.store
                            local.get 0
                            i32.const 2261603
                            i64.load align=1
                            i64.store offset=16 align=1
                            local.get 0
                            i32.const 0
                            i32.store8 offset=24
                            local.get 0
                            i32.const 2261587
                            v128.load align=1
                            v128.store align=1
                            br 11 (;@1;)
                          end
                          local.get 1
                          i32.const 24
                          call 166572
                          local.tee 0
                          i32.store
                          local.get 0
                          i32.const 0
                          i32.store8 offset=22
                          local.get 0
                          i32.const 2262463
                          v128.load align=1
                          v128.store align=1
                          local.get 0
                          i32.const 2262477
                          i64.load align=1
                          i64.store offset=14 align=1
                          local.get 1
                          i64.const -9223371933775560682
                          i64.store offset=4 align=4
                          br 10 (;@1;)
                        end
                        local.get 1
                        i32.const 24
                        call 166572
                        local.tee 0
                        i32.store
                        local.get 1
                        i64.const -9223371933775560687
                        i64.store offset=4 align=4
                        local.get 0
                        i32.const 0
                        i32.store8 offset=17
                        local.get 0
                        i32.const 2212943
                        v128.load align=1
                        v128.store align=1
                        local.get 0
                        i32.const 2212959
                        i32.load8_u
                        i32.store8 offset=16
                        br 9 (;@1;)
                      end
                      i32.const 24
                      call 166572
                      local.set 0
                      local.get 1
                      i64.const -9223371933775560686
                      i64.store offset=4 align=4
                      local.get 1
                      local.get 0
                      i32.store
                      local.get 0
                      i32.const 2261462
                      i32.load16_u align=1
                      i32.store16 offset=16 align=1
                      local.get 0
                      i32.const 0
                      i32.store8 offset=18
                      local.get 0
                      i32.const 2261446
                      v128.load align=1
                      v128.store align=1
                      br 8 (;@1;)
                    end
                    local.get 1
                    i32.const 16
                    call 166572
                    local.tee 0
                    i32.store
                    local.get 1
                    i32.const 15
                    i32.store offset=4
                    local.get 0
                    i32.const 2261374
                    i64.load align=1
                    i64.store offset=7 align=1
                    local.get 0
                    i32.const 2261367
                    i64.load align=1
                    i64.store align=1
                    local.get 0
                    i32.const 0
                    i32.store8 offset=15
                    local.get 1
                    i32.const -2147483632
                    i32.store offset=8
                    br 7 (;@1;)
                  end
                  i32.const 24
                  call 166572
                  local.tee 0
                  i32.const 0
                  i32.store8 offset=20
                  local.get 1
                  i32.const -2147483624
                  i32.store offset=8
                  local.get 0
                  i32.const 2212828
                  i32.load align=1
                  i32.store offset=16 align=1
                  local.get 0
                  i32.const 2212812
                  v128.load align=1
                  v128.store align=1
                  local.get 1
                  i32.const 20
                  i32.store offset=4
                  br 4 (;@3;)
                end
                i32.const 24
                call 166572
                local.set 0
                local.get 1
                i64.const -9223371933775560683
                i64.store offset=4 align=4
                local.get 1
                local.get 0
                i32.store
                local.get 0
                i32.const 2250074
                i64.load align=1
                i64.store offset=13 align=1
                local.get 0
                i32.const 0
                i32.store8 offset=21
                local.get 0
                i32.const 2250061
                v128.load align=1
                v128.store align=1
                br 5 (;@1;)
              end
              i32.const 24
              call 166572
              local.set 0
              local.get 1
              i32.const -2147483624
              i32.store offset=8
              local.get 0
              i32.const 2258415
              i64.load align=1
              i64.store offset=13 align=1
              local.get 0
              i32.const 2258402
              v128.load align=1
              v128.store align=1
              local.get 1
              i32.const 21
              i32.store offset=4
              local.get 1
              local.get 0
              i32.store
              local.get 0
              i32.const 0
              i32.store8 offset=21
              br 4 (;@1;)
            end
            i32.const 32
            call 166572
            local.tee 0
            i32.const 2253649
            i32.load8_u
            i32.store8 offset=24
            local.get 0
            i32.const 2253641
            i64.load align=1
            i64.store offset=16 align=1
            local.get 0
            i32.const 2253625
            v128.load align=1
            v128.store align=1
            br 2 (;@2;)
          end
          i32.const 40
          call 166572
          local.tee 0
          i32.const 2213750
          v128.load align=1
          v128.store offset=16 align=1
          local.get 0
          i32.const 2213734
          v128.load align=1
          v128.store align=1
          local.get 1
          i64.const -9223371865056083936
          i64.store offset=4 align=4
          local.get 1
          local.get 0
          i32.store
          local.get 0
          i32.const 0
          i32.store8 offset=32
          br 2 (;@1;)
        end
        local.get 1
        local.get 0
        i32.store
        br 1 (;@1;)
      end
      local.get 1
      i64.const -9223371899415822311
      i64.store offset=4 align=4
      local.get 1
      local.get 0
      i32.store
      local.get 0
      i32.const 0
      i32.store8 offset=25
    end
    block ;; label = @1
      block (result exnref) ;; label = @2
        try_table (catch_all_ref 0 (;@2;)) ;; label = @3
          local.get 5
          local.get 1
          local.get 2
          call 20547
          local.set 0
          br 2 (;@1;)
        end
        unreachable
      end
      local.get 3
      global.set 0
      local.get 3
      i32.load8_s offset=23
      i32.const 0
      i32.lt_s
      if ;; label = @2
        local.get 3
        i32.load offset=20
        drop
        local.get 3
        i32.load offset=12
        call 166574
      end
      throw_ref
    end
    local.get 3
    i32.load8_s offset=23
    i32.const 0
    i32.lt_s
    if ;; label = @1
      local.get 3
      i32.load offset=20
      drop
      local.get 3
      i32.load offset=12
      call 166574
    end
    local.get 2
    local.get 0
    i32.store
    local.get 3
    i32.const -64
    i32.sub
    global.set 0
  )
  (func (;146642;) (type 5) (param i32 i32) (result i32)
    (local i32 i32 i32 i32 i32 i64 exnref)
    block (result exnref) ;; label = @1
      global.get 0
      i32.const 128
      i32.sub
      local.tee 2
      global.set 0
      block ;; label = @2
        local.get 0
        local.get 1
        i32.eq
        if ;; label = @3
          i32.const 0
          local.set 1
          local.get 0
          i32.load8_s offset=15
          i32.const 0
          i32.ge_s
          br_if 1 (;@2;)
          local.get 0
          i32.load offset=12
          drop
          local.get 0
          i32.load offset=4
          call 166574
          br 1 (;@2;)
        end
        block ;; label = @3
          local.get 1
          if ;; label = @4
            local.get 0
            i32.eqz
            br_if 1 (;@3;)
            local.get 0
            local.get 1
            i32.load
            i32.store
            local.get 0
            local.get 1
            i32.load offset=12
            i32.store offset=12
            local.get 0
            local.get 1
            i64.load offset=4 align=4
            i64.store offset=4 align=4
            local.get 1
            i32.const 0
            i32.store offset=12
            local.get 1
            i64.const 0
            i64.store offset=4 align=4
            local.get 0
            local.set 1
            br 2 (;@2;)
          end
          local.get 0
          i32.load
          local.set 1
          block ;; label = @4
            block (result i32) ;; label = @5
              try_table (catch 1 0 (;@5;)) ;; label = @6
                local.get 2
                i32.const 40
                i32.add
                local.get 0
                i32.const 4
                i32.add
                local.tee 4
                local.get 0
                i32.load offset=4
                local.get 0
                i32.load8_s offset=15
                i32.const 0
                i32.ge_s
                select
                call 154041
                block ;; label = @7
                  block ;; label = @8
                    local.get 2
                    i32.load offset=40
                    local.tee 3
                    i32.eqz
                    if ;; label = @9
                      i32.const 8206976
                      i64.load
                      local.tee 7
                      i64.const 65024
                      i64.and
                      i64.eqz
                      local.get 7
                      i32.wrap_i64
                      i32.const 255
                      i32.and
                      i32.const 6
                      i32.lt_u
                      i32.or
                      br_if 1 (;@8;)
                      local.get 2
                      local.get 7
                      i64.store offset=104
                      local.get 2
                      i32.const 70
                      i32.store offset=124
                      local.get 2
                      i32.const 204531
                      i32.store offset=120
                      local.get 0
                      i32.load8_s offset=15
                      local.set 3
                      local.get 2
                      i64.const 13
                      i64.store offset=48
                      local.get 0
                      i32.load offset=8
                      local.set 5
                      local.get 2
                      local.get 0
                      i32.load offset=4
                      local.get 4
                      local.get 3
                      i32.const 0
                      i32.lt_s
                      local.tee 0
                      select
                      i32.store offset=64
                      local.get 2
                      local.get 5
                      local.get 3
                      local.get 0
                      select
                      i32.store offset=68
                      local.get 2
                      local.get 2
                      i32.const -64
                      i32.sub
                      i32.store offset=56
                      local.get 2
                      local.get 2
                      i64.load offset=104
                      i64.store offset=96
                      local.get 2
                      local.get 2
                      i64.load offset=120 align=4
                      i64.store offset=24
                      local.get 2
                      local.get 2
                      v128.load offset=48 align=8
                      v128.store offset=80 align=8
                      block (result exnref) ;; label = @10
                        try_table (catch_all_ref 0 (;@10;)) ;; label = @11
                          local.get 2
                          i32.const 96
                          i32.add
                          i32.const 2
                          local.get 2
                          i32.const 24
                          i32.add
                          local.get 2
                          i32.const 80
                          i32.add
                          i32.const 1
                          call 157492
                          br 3 (;@8;)
                        end
                        unreachable
                      end
                      local.get 2
                      global.set 0
                      local.get 2
                      i32.const 40
                      i32.add
                      call 168019
                      drop
                      throw_ref
                    end
                    local.get 2
                    local.get 3
                    i32.store offset=48
                    local.get 2
                    local.get 2
                    i32.load offset=44
                    i32.store offset=52
                    br 1 (;@7;)
                  end
                  local.get 2
                  i64.const 0
                  i64.store offset=48 align=4
                  local.get 2
                  i32.load offset=44
                  local.tee 0
                  i32.eqz
                  br_if 0 (;@7;)
                  local.get 0
                  i32.const -1
                  i32.atomic.rmw.add offset=4
                  br_if 0 (;@7;)
                  try_table (catch_all_ref 6 (;@1;)) ;; label = @8
                    local.get 0
                    local.get 0
                    i32.load
                    i32.load offset=8
                    call_indirect (type 0)
                  end
                  local.get 0
                  call 164173
                end
                block (result exnref) ;; label = @7
                  try_table (catch_all_ref 0 (;@7;)) ;; label = @8
                    local.get 2
                    i32.const 48
                    i32.add
                    local.set 3
                    global.get 0
                    i32.const -64
                    i32.add
                    local.tee 0
                    global.set 0
                    local.get 0
                    i32.const 23931556
                    i32.load
                    i32.store offset=60
                    block ;; label = @9
                      local.get 1
                      i32.load offset=4
                      local.tee 4
                      if ;; label = @10
                        local.get 1
                        i32.load
                        local.set 5
                        local.get 4
                        i32.const 1
                        i32.atomic.rmw.add offset=8
                        drop
                        local.get 0
                        i32.const 0
                        i32.store offset=32
                        local.get 0
                        local.get 4
                        call 164174
                        local.tee 6
                        i32.store offset=36
                        local.get 6
                        if ;; label = @11
                          local.get 0
                          local.get 5
                          i32.store offset=32
                        end
                        local.get 4
                        call 164173
                        br 1 (;@9;)
                      end
                      local.get 0
                      i64.const 0
                      i64.store offset=32 align=4
                    end
                    local.get 0
                    i64.const 0
                    i64.store offset=24
                    local.get 0
                    i32.const 48
                    i32.add
                    local.get 1
                    i32.const 8
                    i32.add
                    i32.const 0
                    call 158152
                    local.set 4
                    block ;; label = @9
                      block (result exnref) ;; label = @10
                        try_table (catch_all_ref 0 (;@10;)) ;; label = @11
                          block ;; label = @12
                            block (result exnref) ;; label = @13
                              try_table (catch_all_ref 0 (;@13;)) ;; label = @14
                                local.get 1
                                i32.atomic.load8_u offset=60
                                i32.const 1
                                i32.eq
                                if ;; label = @15
                                  i32.const 2
                                  call 6511
                                  unreachable
                                end
                                local.get 1
                                local.get 3
                                i32.load
                                i32.store offset=48
                                local.get 1
                                local.get 3
                                i32.load offset=4
                                i32.store offset=52
                                local.get 3
                                i64.const 0
                                i64.store align=4
                                local.get 1
                                i32.const 1
                                i32.store8 offset=56
                                local.get 1
                                i32.const 1
                                i32.atomic.store8 offset=60
                                local.get 1
                                i32.const 16
                                i32.add
                                call 798
                                br 2 (;@12;)
                              end
                              unreachable
                            end
                            local.get 0
                            global.set 0
                            local.get 4
                            call 158151
                            drop
                            throw_ref
                          end
                          local.get 1
                          i32.load offset=28
                          local.set 3
                          local.get 0
                          i32.const 0
                          i32.store offset=40
                          local.get 0
                          local.get 1
                          i32.load offset=32
                          local.tee 5
                          i32.store offset=44
                          local.get 1
                          i32.const 0
                          i32.store offset=28
                          local.get 0
                          i32.const 24
                          i32.add
                          local.get 3
                          call 4495
                          local.get 0
                          local.get 5
                          i32.store offset=28
                          local.get 0
                          i32.const 40
                          i32.add
                          i32.const 0
                          call 4495
                          local.get 4
                          call 158151
                          drop
                          local.get 0
                          i32.load offset=24
                          local.tee 3
                          i32.eqz
                          br_if 2 (;@9;)
                          local.get 3
                          call 158134
                          br 2 (;@9;)
                        end
                        unreachable
                      end
                      local.get 0
                      global.set 0
                      local.get 0
                      i32.const 24
                      i32.add
                      i32.const 0
                      call 4495
                      local.get 0
                      i32.const 32
                      i32.add
                      call 168019
                      drop
                      throw_ref
                    end
                    local.get 0
                    i32.const 24
                    i32.add
                    i32.const 0
                    call 4495
                    block ;; label = @9
                      local.get 0
                      i32.load offset=36
                      local.tee 3
                      i32.eqz
                      br_if 0 (;@9;)
                      local.get 3
                      i32.const -1
                      i32.atomic.rmw.add offset=4
                      br_if 0 (;@9;)
                      local.get 3
                      local.get 3
                      i32.load
                      i32.load offset=8
                      call_indirect (type 0)
                      local.get 3
                      call 164173
                    end
                    i32.const 23931556
                    i32.load
                    local.get 0
                    i32.load offset=60
                    i32.eq
                    if ;; label = @9
                      local.get 0
                      i32.const -64
                      i32.sub
                      global.set 0
                      br 5 (;@4;)
                    end
                    unreachable
                  end
                  unreachable
                end
                local.get 2
                global.set 0
                local.get 2
                i32.const 48
                i32.add
                call 168019
                drop
                throw_ref
              end
              unreachable
            end
            local.get 2
            global.set 0
            call 164525
            drop
            local.get 2
            i32.const 116
            i32.add
            call 163601
            local.get 2
            local.get 2
            i32.load offset=116
            i32.store offset=36
            local.get 2
            i32.const 0
            i32.store offset=116
            block ;; label = @5
              block (result exnref) ;; label = @6
                try_table (catch_all_ref 0 (;@6;)) ;; label = @7
                  global.get 0
                  i32.const -64
                  i32.add
                  local.tee 0
                  global.set 0
                  local.get 0
                  i32.const 23931556
                  i32.load
                  i32.store offset=60
                  block ;; label = @8
                    block ;; label = @9
                      local.get 2
                      i32.const 36
                      i32.add
                      local.tee 4
                      i32.load
                      if ;; label = @10
                        local.get 1
                        i32.load offset=4
                        local.tee 3
                        i32.eqz
                        br_if 1 (;@9;)
                        local.get 1
                        i32.load
                        local.set 5
                        local.get 3
                        i32.const 1
                        i32.atomic.rmw.add offset=8
                        drop
                        local.get 0
                        i32.const 0
                        i32.store offset=24
                        local.get 0
                        local.get 3
                        call 164174
                        local.tee 6
                        i32.store offset=28
                        local.get 6
                        if ;; label = @11
                          local.get 0
                          local.get 5
                          i32.store offset=24
                        end
                        local.get 3
                        call 164173
                        br 2 (;@8;)
                      end
                      local.get 0
                      i32.const 2706615
                      i32.store offset=16
                      i32.const 7843480
                      i32.load
                      i32.const 2823300
                      local.get 0
                      i32.const 16
                      i32.add
                      call 163211
                      call 164531
                      unreachable
                    end
                    local.get 0
                    i64.const 0
                    i64.store offset=24 align=4
                  end
                  local.get 0
                  i64.const 0
                  i64.store offset=32
                  local.get 0
                  i32.const 48
                  i32.add
                  local.get 1
                  i32.const 8
                  i32.add
                  i32.const 0
                  call 158152
                  local.set 3
                  block ;; label = @8
                    block (result exnref) ;; label = @9
                      try_table (catch_all_ref 0 (;@9;)) ;; label = @10
                        block ;; label = @11
                          block (result exnref) ;; label = @12
                            try_table (catch_all_ref 0 (;@12;)) ;; label = @13
                              local.get 1
                              i32.atomic.load8_u offset=60
                              i32.const 1
                              i32.eq
                              if ;; label = @14
                                i32.const 2
                                call 6511
                                unreachable
                              end
                              local.get 4
                              i32.load
                              local.set 5
                              local.get 4
                              i32.const 0
                              i32.store
                              local.get 0
                              local.get 1
                              i32.load offset=44
                              i32.store offset=40
                              local.get 1
                              local.get 5
                              i32.store offset=44
                              local.get 0
                              i32.const 40
                              i32.add
                              call 163598
                              local.get 1
                              i32.const 1
                              i32.atomic.store8 offset=60
                              local.get 1
                              i32.const 16
                              i32.add
                              call 798
                              br 2 (;@11;)
                            end
                            unreachable
                          end
                          local.get 0
                          global.set 0
                          local.get 3
                          call 158151
                          drop
                          throw_ref
                        end
                        local.get 1
                        i32.load offset=32
                        local.set 4
                        local.get 0
                        i32.const 0
                        i32.store offset=40
                        local.get 0
                        local.get 4
                        i32.store offset=44
                        local.get 1
                        i32.load offset=28
                        local.set 5
                        local.get 1
                        i32.const 0
                        i32.store offset=28
                        local.get 0
                        i32.const 32
                        i32.add
                        local.get 5
                        call 4495
                        local.get 0
                        local.get 4
                        i32.store offset=36
                        local.get 0
                        i32.const 40
                        i32.add
                        i32.const 0
                        call 4495
                        local.get 3
                        call 158151
                        drop
                        local.get 0
                        i32.load offset=32
                        local.tee 1
                        i32.eqz
                        br_if 2 (;@8;)
                        local.get 1
                        call 158134
                        br 2 (;@8;)
                      end
                      unreachable
                    end
                    local.get 0
                    global.set 0
                    local.get 0
                    i32.const 32
                    i32.add
                    i32.const 0
                    call 4495
                    local.get 0
                    i32.const 24
                    i32.add
                    call 168019
                    drop
                    throw_ref
                  end
                  local.get 0
                  i32.const 32
                  i32.add
                  i32.const 0
                  call 4495
                  block ;; label = @8
                    local.get 0
                    i32.load offset=28
                    local.tee 1
                    i32.eqz
                    br_if 0 (;@8;)
                    local.get 1
                    i32.const -1
                    i32.atomic.rmw.add offset=4
                    br_if 0 (;@8;)
                    local.get 1
                    local.get 1
                    i32.load
                    i32.load offset=8
                    call_indirect (type 0)
                    local.get 1
                    call 164173
                  end
                  i32.const 23931556
                  i32.load
                  local.get 0
                  i32.load offset=60
                  i32.eq
                  if ;; label = @8
                    local.get 0
                    i32.const -64
                    i32.sub
                    global.set 0
                    br 3 (;@5;)
                  end
                  unreachable
                end
                unreachable
              end
              local.get 2
              global.set 0
              local.get 2
              i32.const 36
              i32.add
              call 163598
              local.get 2
              i32.const 116
              i32.add
              call 163598
              block ;; label = @6
                block ;; label = @7
                  try_table (catch_all 0 (;@7;)) ;; label = @8
                    call 164526
                    br 2 (;@6;)
                  end
                  unreachable
                end
                local.get 2
                global.set 0
                call 164531
                unreachable
              end
              throw_ref
            end
            local.get 2
            i32.const 36
            i32.add
            call 163598
            local.get 2
            i32.const 116
            i32.add
            call 163598
            call 164526
            br 1 (;@3;)
          end
          local.get 2
          i32.load offset=52
          local.tee 0
          i32.eqz
          br_if 0 (;@3;)
          local.get 0
          i32.const -1
          i32.atomic.rmw.add offset=4
          br_if 0 (;@3;)
          local.get 0
          local.get 0
          i32.load
          i32.load offset=8
          call_indirect (type 0)
          local.get 0
          call 164173
        end
        i32.const 0
        local.set 1
      end
      local.get 2
      i32.const 128
      i32.add
      global.set 0
      local.get 1
      return
    end
    throw_ref
  )
  (func (;151072;) (type 5) (param i32 i32) (result i32)
    (local i32 i32 i32 i32 i32 i32 i32 i32 i32 i64 exnref)
    global.get 0
    i32.const 32
    i32.sub
    local.tee 1
    global.set 0
    local.get 1
    i32.const 23931556
    i32.load
    i32.store offset=28
    block (result i32) ;; label = @1
      i32.const 0
      local.get 0
      i32.atomic.load offset=16
      i32.const 1
      i32.ne
      br_if 0 (;@1;)
      drop
      i32.const 0
      local.get 0
      i32.atomic.load8_u offset=228
      i32.const 1
      i32.ne
      br_if 0 (;@1;)
      drop
      local.get 1
      i32.const 16
      i32.add
      local.get 0
      i32.const 56
      i32.add
      i32.const 0
      call 158152
      local.get 1
      local.get 0
      i32.load offset=76
      local.tee 7
      i32.store offset=4
      local.get 0
      i32.const 0
      i32.store offset=76
      local.get 1
      local.get 0
      i32.load offset=80
      local.tee 5
      i32.store offset=8
      local.get 0
      i32.const 0
      i32.store offset=80
      local.get 1
      local.get 0
      i32.load offset=84
      i32.store offset=12
      local.get 0
      i32.const 0
      i32.store offset=84
      call 158151
      drop
      block ;; label = @2
        block (result exnref) ;; label = @3
          try_table (catch_all_ref 0 (;@3;)) ;; label = @4
            global.get 0
            i32.const -64
            i32.add
            local.tee 2
            global.set 0
            local.get 0
            i32.atomic.load offset=224
            local.set 8
            block ;; label = @5
              local.get 1
              i32.const 4
              i32.add
              local.tee 4
              i32.load
              local.tee 3
              local.get 4
              i32.load offset=4
              local.tee 10
              i32.eq
              if ;; label = @6
                i32.const 0
                local.set 4
                br 1 (;@5;)
              end
              i32.const 0
              local.set 4
              block ;; label = @6
                loop ;; label = @7
                  block ;; label = @8
                    local.get 4
                    i32.const 1
                    i32.add
                    local.set 4
                    block ;; label = @9
                      block (result i32) ;; label = @10
                        block ;; label = @11
                          block ;; label = @12
                            block ;; label = @13
                              local.get 3
                              i32.load
                              i32.const 2
                              i32.sub
                              br_table 2 (;@11;) 1 (;@12;) 4 (;@9;) 4 (;@9;) 0 (;@13;) 4 (;@9;)
                            end
                            local.get 8
                            i32.const 0
                            i32.const 0
                            call 201
                            i32.eqz
                            if ;; label = @13
                              local.get 0
                              i32.const 2
                              call 150999
                              br 8 (;@5;)
                            end
                            local.get 2
                            i32.const 32
                            call 166572
                            local.tee 3
                            i32.store offset=36
                            local.get 3
                            i32.const 0
                            i32.store8 offset=25
                            local.get 2
                            i32.const 25
                            i32.store offset=40
                            local.get 3
                            i32.const 619258
                            i32.load8_u
                            i32.store8 offset=24
                            local.get 3
                            i32.const 619250
                            i64.load align=1
                            i64.store offset=16 align=1
                            local.get 3
                            i32.const 619234
                            v128.load align=1
                            v128.store align=1
                            local.get 2
                            i32.const -2147483616
                            i32.store offset=44
                            block (result exnref) ;; label = @13
                              try_table (catch_all_ref 0 (;@13;)) ;; label = @14
                                local.get 0
                                local.get 2
                                i32.const 36
                                i32.add
                                call 150998
                                br 8 (;@6;)
                              end
                              unreachable
                            end
                            local.get 2
                            global.set 0
                            local.get 2
                            i32.load8_s offset=47
                            i32.const 0
                            i32.lt_s
                            if ;; label = @13
                              local.get 2
                              i32.load offset=44
                              drop
                              local.get 2
                              i32.load offset=36
                              call 166574
                            end
                            throw_ref
                          end
                          local.get 8
                          local.get 3
                          i32.load offset=4
                          local.get 3
                          i32.const 4
                          i32.add
                          local.get 3
                          i32.load8_s offset=15
                          local.tee 6
                          i32.const 0
                          i32.lt_s
                          local.tee 9
                          select
                          local.get 3
                          i32.load offset=8
                          local.get 6
                          local.get 9
                          select
                          call 202
                          br 1 (;@10;)
                        end
                        local.get 8
                        local.get 3
                        i32.const 4
                        i32.add
                        local.get 3
                        i32.load offset=4
                        local.get 3
                        i32.load8_s offset=15
                        i32.const 0
                        i32.ge_s
                        select
                        call 203
                      end
                      i32.eqz
                      br_if 0 (;@9;)
                      local.get 2
                      i32.const 40
                      call 166572
                      local.tee 3
                      i32.store offset=36
                      local.get 3
                      i32.const 1767655
                      v128.load align=1
                      v128.store offset=16 align=1
                      local.get 3
                      i32.const 1767639
                      v128.load align=1
                      v128.store align=1
                      local.get 2
                      i32.const 32
                      i32.store offset=40
                      local.get 3
                      i32.const 0
                      i32.store8 offset=32
                      local.get 2
                      i32.const -2147483608
                      i32.store offset=44
                      block (result exnref) ;; label = @10
                        try_table (catch_all_ref 0 (;@10;)) ;; label = @11
                          local.get 0
                          local.get 2
                          i32.const 36
                          i32.add
                          call 150998
                          br 3 (;@8;)
                        end
                        unreachable
                      end
                      local.get 2
                      global.set 0
                      local.get 2
                      i32.load8_s offset=47
                      i32.const 0
                      i32.lt_s
                      if ;; label = @10
                        local.get 2
                        i32.load offset=44
                        drop
                        local.get 2
                        i32.load offset=36
                        call 166574
                      end
                      throw_ref
                    end
                    i32.const 8230096
                    i64.load align=4
                    local.tee 11
                    i32.wrap_i64
                    local.tee 6
                    i32.const 8
                    i32.shr_u
                    i32.const 255
                    i32.and
                    i32.const 3
                    i32.lt_u
                    local.get 6
                    i32.const 255
                    i32.and
                    i32.const 6
                    i32.lt_u
                    i32.or
                    i32.eqz
                    if ;; label = @9
                      local.get 2
                      local.get 11
                      i64.store offset=16
                      local.get 3
                      i32.load
                      local.set 6
                      local.get 0
                      i32.load offset=12
                      local.set 9
                      local.get 2
                      local.get 11
                      i64.store offset=24
                      local.get 2
                      local.get 9
                      i32.store offset=48
                      local.get 2
                      local.get 6
                      i32.store offset=52
                      local.get 2
                      i32.const 24
                      i32.add
                      i32.const 2093019
                      local.get 2
                      i32.const 48
                      i32.add
                      call 157497
                    end
                    local.get 3
                    i32.const 16
                    i32.add
                    local.tee 3
                    local.get 10
                    i32.ne
                    br_if 1 (;@7;)
                    br 3 (;@5;)
                  end
                end
                i32.const -1
                local.set 4
                local.get 2
                i32.load8_s offset=47
                i32.const 0
                i32.ge_s
                br_if 1 (;@5;)
                local.get 2
                i32.load offset=44
                drop
                local.get 2
                i32.load offset=36
                call 166574
                br 1 (;@5;)
              end
              i32.const -1
              local.set 4
              local.get 2
              i32.load8_s offset=47
              i32.const 0
              i32.ge_s
              br_if 0 (;@5;)
              local.get 2
              i32.load offset=44
              drop
              local.get 2
              i32.load offset=36
              call 166574
            end
            local.get 2
            i32.const -64
            i32.sub
            global.set 0
            local.get 4
            local.set 0
            br 2 (;@2;)
          end
          unreachable
        end
        local.get 1
        global.set 0
        local.get 1
        i32.const 4
        i32.add
        call 4235
        throw_ref
      end
      local.get 7
      if ;; label = @2
        local.get 5
        local.get 7
        i32.ne
        if ;; label = @3
          loop ;; label = @4
            local.get 5
            i32.const 1
            i32.sub
            i32.load8_s
            i32.const 0
            i32.lt_s
            if ;; label = @5
              local.get 5
              i32.const 4
              i32.sub
              i32.load
              drop
              local.get 5
              i32.const 12
              i32.sub
              i32.load
              call 166574
            end
            local.get 7
            local.get 5
            i32.const 16
            i32.sub
            local.tee 5
            i32.ne
            br_if 0 (;@4;)
          end
        end
        local.get 7
        call 166574
      end
      local.get 0
      i32.const 0
      i32.ne
    end
    local.set 0
    i32.const 23931556
    i32.load
    local.get 1
    i32.load offset=28
    i32.eq
    if ;; label = @1
      local.get 1
      i32.const 32
      i32.add
      global.set 0
      local.get 0
      return
    end
    unreachable
  )
